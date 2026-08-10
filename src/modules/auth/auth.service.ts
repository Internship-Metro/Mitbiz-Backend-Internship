import { authRepository } from './auth.repository';
import { hashPassword, comparePassword } from '@common/utils/hash.util';
import { signToken, signRefreshToken, signRegistrationToken, verifyToken, JwtPayload } from '@common/utils/jwt.util';
import { AppError } from '@common/utils/app-error.util';
import { RegisterStep1Type } from './dto/register-step1.dto';
import { RegisterStep2Type } from './dto/register-step2.dto';
import { RegisterStep3Type } from './dto/register-step3.dto';
import { LoginType } from './dto/login.dto';
import { ChangePasswordType } from './dto/change-password.dto';
import { sendVerificationEmail } from '@common/utils/email.util';
import { env } from '@config/env';
import { randomUUID } from 'crypto';

// Helper: generate pasangan access + refresh token
function generateTokenPair(payload: Omit<JwtPayload, 'type'>) {
  const accessToken  = signToken(payload);         // berlaku 1 jam (sesuai JWT_EXPIRES_IN di .env)
  const refreshToken = signRefreshToken(payload);  // berlaku 7 hari
  return { accessToken, refreshToken };
}

export class AuthService {
  /**
   * Register Step 1: Create user account
   */
  async registerStep1(data: RegisterStep1Type) {
    const existingUser = await authRepository.findUserByEmail(data.email);

    if (existingUser) {
      // Sudah ACTIVE = akun penuh & terverifikasi, tidak boleh ditimpa
      if (existingUser.status === 'ACTIVE') {
        throw new AppError('Email sudah terdaftar dan aktif. Silakan login.', 400);
      }

      // INACTIVE = email belum diverifikasi → data belum "confirmed" oleh user
      // User berhak mengulang dari awal apapun kondisinya (belum Step 2, stuck di Step 2, bahkan selesai Step 3)
      // Hapus semua data lama (user + tenant + branch) dan mulai bersih
      await authRepository.deleteUserAndRelatedData(existingUser.id);
    }

    const hashedPassword = await hashPassword(data.password);

    // User dibuat dengan status INACTIVE — aktif setelah verifikasi email di akhir Step 3
    const newUser = await authRepository.createUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'INACTIVE',
    });

    // Langsung beri JWT agar user bisa lanjut ke Step 2 & 3
    const { accessToken, refreshToken } = generateTokenPair({
      userId: newUser.id,
      role: newUser.role,
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Register Step 2: Create business (Bisnis)
   */
  async registerStep2(userId: string, data: RegisterStep2Type) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new AppError('User tidak ditemukan', 404);

    // Cegah duplikasi: kalau user sudah punya bisnis, jangan buat yang baru
    if (user.businessId) {
      throw new AppError(
        'Bisnis sudah terdaftar. Lanjutkan ke Step 3 untuk mendaftarkan outlet.',
        400
      );
    }

    // Generate slug dari nama bisnis
    const slug = data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    // Generate businessCode otomatis: BIZ-001, BIZ-002, dst.
    // Pakai MAX businessCode yang ada (bukan COUNT) agar tidak bentrok
    // ketika ada bisnis yang dihapus oleh cleanup job.
    const latestCode = await authRepository.findLatestBusinessCode();
    let nextNumber = 1;
    if (latestCode) {
      const match = latestCode.match(/BIZ-(\d+)/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }
    const businessCode = `BIZ-${String(nextNumber).padStart(3, '0')}`;

    let business;
    try {
      business = await authRepository.createBusiness({
        name: data.businessName,
        slug: slug,
        businessCode: businessCode,
        businessCategory: data.businessCategory,
        city: data.city,
        province: data.province,
      });
    } catch (err: any) {
      // P2002 = unique constraint violation
      // Terjadi jika ada race condition (dua request bersamaan)
      if (err?.code === 'P2002' && err?.meta?.target?.includes('businessCode')) {
        throw new AppError('Terjadi konflik data bisnis. Silakan coba lagi.', 409);
      }
      throw err;
    }

    // Hubungkan user ke bisnis yang baru dibuat
    await authRepository.updateUserBusinessId(userId, business.id);

    return business;
  }

  /**
   * Register Step 3: Create outlet (Outlet)
   */
  async registerStep3(userId: string, data: RegisterStep3Type) {
    const user = await authRepository.findUserById(userId);
    if (!user || !user.businessId) throw new AppError('User atau bisnis tidak ditemukan', 404);

    // Cegah duplikasi: user tidak boleh membuat outlet lebih dari sekali lewat endpoint ini
    if (user.outletId) {
      throw new AppError('Outlet pertama sudah terdaftar. Gunakan fitur Manajemen Outlet untuk menambah outlet baru.', 400);
    }

    const outlet = await authRepository.createOutlet({
      business: { connect: { id: user.businessId } },
      name: data.outletName,
      address: data.outletAddress,
      phone: data.outletPhone,
    });

    // Update user to belong to this outlet
    await authRepository.updateUserOutletId(userId, outlet.id);

    // Registrasi selesai — kirim email verifikasi sekarang
    const verificationToken = randomUUID();
    await authRepository.setEmailVerificationToken(userId, verificationToken);
    await sendVerificationEmail(user.email!, user.name, verificationToken);

    return {
      outlet,
      message: 'Pendaftaran selesai! Email verifikasi telah dikirim ke ' + user.email,
    };
  }

  /**
   * Login
   */
  async login(data: LoginType) {
    // Auto-detect: ada '@' → email, tidak ada → username
    const isEmail = data.identifier.includes('@');
    const user = isEmail
      ? await authRepository.findUserByEmail(data.identifier)
      : await authRepository.findByUsername(data.identifier);

    if (!user) {
      throw new AppError('Email/username atau password salah', 401);
    }

    // Verifikasi password terlebih dahulu — selalu cek password meski akun belum aktif
    // Ini mencegah enumeration attack (orang tidak bisa tahu apakah email terdaftar dari error message)
    const isMatch = await comparePassword(data.password, user.password);
    if (!isMatch) {
      throw new AppError('Email/username atau password salah', 401);
    }

    // ── Deteksi: registrasi belum selesai ────────────────────────────────────
    // Kasus: user INACTIVE + emailVerifiedAt null = akun belum diverifikasi
    if (!user.emailVerifiedAt && user.status === 'INACTIVE') {
      // Tentukan user berhenti di step mana
      const currentStep = !user.businessId ? 2 : !user.outletId ? 3 : null;

      if (currentStep !== null) {
        // Keluarkan registration token short-lived (1 jam)
        // Hanya valid untuk endpoint Step 2 & Step 3
        const registrationToken = signRegistrationToken({
          userId: user.id,
          role: user.role,
          businessId: user.businessId,
          outletId: user.outletId,
        });

        return {
          requiresRegistration: true,
          currentStep,
          registrationToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          message: `Pendaftaran kamu belum selesai. Lanjutkan dari langkah ${currentStep}.`,
        };
      }

      // Sudah selesai Step 3 tapi belum verifikasi email
      throw new AppError(
        'Email belum diverifikasi. Cek inbox kamu atau gunakan fitur kirim ulang email verifikasi.',
        403
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Akun dinonaktifkan oleh admin (bukan karena belum verifikasi)
    if (user.status === 'INACTIVE') {
      throw new AppError('Akun anda dinonaktifkan. Hubungi administrator.', 403);
    }

    await authRepository.updateLastLogin(user.id);

    const { accessToken, refreshToken } = generateTokenPair({
      userId: user.id,
      role: user.role,
      businessId: user.businessId,
      outletId: user.outletId,
      permissions: user.customRole?.permissions,
    });

    return {
      requiresRegistration: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
        outletId: user.outletId,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Verifikasi Email
   */
  async verifyEmail(token: string) {
    const user = await authRepository.findUserByVerificationToken(token);
    if (!user) {
      throw new AppError('Link verifikasi tidak valid atau sudah digunakan', 400);
    }

    // Cek apakah token sudah kadaluarsa (24 jam)
    if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < new Date()) {
      throw new AppError(
        'Link verifikasi sudah kadaluarsa (24 jam). Silakan minta kirim ulang email verifikasi.',
        400
      );
    }

    await authRepository.markEmailAsVerified(user.id);

    // Setelah verifikasi, langsung kasih access token lengkap untuk login
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user.id,
      role: user.role,
      businessId: user.businessId ?? undefined,
      outletId: user.outletId ?? undefined,
      permissions: user.customRole?.permissions,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
        outletId: user.outletId,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Kirim ulang email verifikasi
   * Dipakai jika token expired atau email tidak diterima
   */
  async resendVerificationEmail(email: string) {
    const user = await authRepository.findUserByEmail(email);

    // Selalu balas sukses meski email tidak ada (mencegah user tahu email mana yang terdaftar)
    if (!user || user.status === 'ACTIVE' || user.emailVerifiedAt) {
      return { message: 'Jika email terdaftar dan belum diverifikasi, link verifikasi baru sudah dikirim.' };
    }

    // Blokir jika user stuck di Step 2 (punya bisnis tapi belum punya outlet)
    // Mengirim email verifikasi di tahap ini akan mengaktifkan akun tanpa outlet = state rusak
    if (user.businessId && !user.outletId) {
      throw new AppError(
        'Pendaftaran bisnis kamu belum selesai. Silakan lanjutkan ke langkah 3 untuk mendaftarkan outlet pertama terlebih dahulu.',
        400
      );
    }

    // Cek apakah sudah lebih dari 24 jam (akun akan segera dihapus oleh cleanup job)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    if (user.createdAt < twentyFourHoursAgo) {
      throw new AppError('Akun ini sudah kadaluarsa (lebih dari 24 jam). Silakan daftar ulang dengan email yang sama.', 400);
    }

    // Generate token baru dan kirim email
    const verificationToken = randomUUID();
    await authRepository.setEmailVerificationToken(user.id, verificationToken);
    await sendVerificationEmail(user.email!, user.name, verificationToken);

    return { message: 'Jika email terdaftar dan belum diverifikasi, link verifikasi baru sudah dikirim.' };
  }

  /**
   * Refresh Access Token
   * Verifikasi refresh token yang valid lalu kembalikan access token baru
   */
  async refreshAccessToken(refreshToken: string) {
    // Verifikasi token — akan throw jika expired atau invalid
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch {
      throw new AppError('Refresh token tidak valid atau sudah expired. Silakan login ulang.', 401);
    }

    // Pastikan ini benar-benar refresh token, bukan access token
    if (decoded.type !== 'refresh') {
      throw new AppError('Token yang diberikan bukan refresh token.', 401);
    }

    // Pastikan user masih ada dan aktif di database
    const user = await authRepository.findUserById(decoded.userId);
    if (!user) throw new AppError('User tidak ditemukan.', 404);
    if (user.status === 'INACTIVE') throw new AppError('Akun dinonaktifkan.', 403);
    if (!user.emailVerifiedAt) throw new AppError('Email belum diverifikasi.', 403);

    // Generate access token baru
    const newAccessToken = signToken({
      userId: user.id,
      role: user.role,
      businessId: user.businessId ?? undefined,
      outletId: user.outletId ?? undefined,
      permissions: user.customRole?.permissions,
    });

    return { accessToken: newAccessToken };
  }

  /**
   * Logout
   */
  async logout(token: string, userId: string) {
    // decode token to find expiration? Or just set a fixed max age
    // for simplicity, let's just use 1 day from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 
    await authRepository.blacklistToken(token, userId, expiresAt);
    return true;
  }

  /**
   * Change Password
   */
  async changePassword(userId: string, data: ChangePasswordType) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new AppError('User tidak ditemukan', 404);

    const isMatch = await comparePassword(data.oldPassword, user.password);
    if (!isMatch) {
      throw new AppError('Password lama salah', 400);
    }

    const newHashed = await hashPassword(data.newPassword);
    await authRepository.updatePassword(userId, newHashed);

    return true;
  }

  /**
   * Get Me
   */
  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new AppError('User tidak ditemukan', 404);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      outletId: user.outletId,
      avatarUrl: user.avatarUrl,
    };
  }
}

export const authService = new AuthService();
