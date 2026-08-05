import { userRepository } from './user.repository';
import { AppError } from '@common/utils/app-error.util';
import { hashPassword } from '@common/utils/hash.util';
import { CreateUserType } from './dto/create-user.dto';
import { UpdateUserType } from './dto/update-user.dto';

export class UserService {
  /**
   * Ambil semua user
   * - SUPER_ADMIN: lihat semua user (bisa filter by businessId)
   * - ADMIN: hanya user di bisnis miliknya sendiri
   */
  async getAllUsers({
    requesterRole,
    requesterBusinessId,
    requesterOutletId,
    businessId,
    outletId,
    role,
    search,
    page = 1,
    limit = 10,
  }: {
    requesterRole: string;
    requesterBusinessId?: string | null;
    requesterOutletId?: string | null;
    businessId?: string;
    outletId?: string;
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let resolvedBusinessId = businessId;
    let resolvedOutletId = outletId;

    if (requesterRole !== 'SUPER_ADMIN') {
      if (!requesterBusinessId) {
        throw new AppError('Anda tidak memiliki akses bisnis', 403);
      }
      resolvedBusinessId = requesterBusinessId; // Paksa pakai businessId dari token

      if (requesterRole === 'ADMIN') {
        if (!requesterOutletId) {
          throw new AppError('Anda tidak memiliki akses cabang', 403);
        }
        resolvedOutletId = requesterOutletId; // Kunci ke outlet admin tersebut
      }
    }

    const { users, total } = await userRepository.findAll({
      businessId: resolvedBusinessId,
      outletId: resolvedOutletId,
      role,
      search,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);
    return { data: users, meta: { total, page, limit, totalPages } };
  }

  /**
   * Ambil detail satu user berdasarkan ID
   * Admin hanya boleh akses user di bisnis miliknya
   */
  async getUserById(
    id: string,
    requesterRole: string,
    requesterBusinessId?: string | null,
    requesterOutletId?: string | null,
  ) {
    const user = await userRepository.findById(id);

    if (!user) throw new AppError('User tidak ditemukan', 404);

    if (requesterRole !== 'SUPER_ADMIN') {
      if (user.businessId !== requesterBusinessId) {
        throw new AppError('Anda tidak memiliki akses ke user ini', 403);
      }
      if (requesterRole === 'ADMIN' && user.outletId !== requesterOutletId) {
        throw new AppError('Anda hanya dapat mengakses user di cabang Anda sendiri', 403);
      }
    }

    return user;
  }

  /**
   * Buat user baru
   * - SUPER_ADMIN: bisa buat user di bisnis manapun, wajib kirim businessId
   * - ADMIN: buat user (KASIR) di bisnis miliknya — businessId otomatis dari token
   */
  async createUser(
    data: CreateUserType,
    requesterRole: string,
    requesterBusinessId?: string | null,
    requesterOutletId?: string | null,
  ) {
    // Tentukan businessId final
    const resolvedBusinessId =
      requesterRole === 'SUPER_ADMIN'
        ? data.businessId
        : requesterBusinessId ?? undefined;

    // Admin wajib punya businessId
    if (!resolvedBusinessId) {
      throw new AppError('businessId wajib diisi', 400);
    }

    // Validasi role berdasarkan hirarki
    if (requesterRole !== 'SUPER_ADMIN') {
      if (requesterRole === 'ADMIN' && data.role !== 'STAFF') {
        throw new AppError('Admin hanya bisa membuat akun tipe STAFF', 403);
      }
    }

    // Jika membuat akun STAFF, wajib kirim roleId dan validasi ke database
    if (data.role === 'STAFF') {
      if (!data.roleId) {
        throw new AppError('roleId wajib diisi jika membuat akun STAFF', 400);
      }
      // Memanggil method di roleRepository bisa dilakukan jika di-import.
      // Namun untuk meminimalisir cross-dependency, kita bisa buat fungsi kecil di userRepository atau cek pakai prisma langsung di dalam userRepository.
      const isValidRole = await userRepository.verifyRoleBelongsToBusiness(data.roleId, resolvedBusinessId);
      if (!isValidRole) {
        throw new AppError('Role tidak valid atau bukan milik bisnis ini', 400);
      }
    }

    // Cek duplikat email
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('Email sudah terdaftar', 400);
    }

    // Jika outletId dikirim, pastikan outlet milik bisnis yang sama
    if (data.outletId) {
      const outlet = await userRepository.findOutletByIdAndBusiness(
        data.outletId,
        resolvedBusinessId,
      );
      if (!outlet) {
        throw new AppError('Outlet tidak ditemukan atau bukan milik bisnis ini', 404);
      }
    }

    const hashedPassword = await hashPassword(data.password);

    const newUser = await userRepository.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: data.role,
      roleId: data.role === 'STAFF' ? data.roleId : undefined,
      businessId: resolvedBusinessId,
      outletId: data.outletId ?? requesterOutletId ?? undefined,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(), // langsung verified karena dibuat oleh admin
    });

    return newUser;
  }

  /**
   * Update data user
   * Admin hanya boleh update user di bisnis miliknya
   */
  async updateUser(
    id: string,
    data: UpdateUserType,
    requesterRole: string,
    requesterBusinessId?: string | null,
    requesterOutletId?: string | null,
  ) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User tidak ditemukan', 404);

    if (requesterRole !== 'SUPER_ADMIN') {
      if (user.businessId !== requesterBusinessId) {
        throw new AppError('Anda tidak memiliki akses untuk mengubah user ini', 403);
      }
      if (requesterRole === 'ADMIN') {
        if (user.outletId !== requesterOutletId) {
          throw new AppError('Anda hanya dapat mengubah user di cabang Anda sendiri', 403);
        }
        if (data.outletId && data.outletId !== requesterOutletId) {
          throw new AppError('Anda tidak dapat memindahkan user ke cabang lain', 403);
        }
      }
    }

    // Jika outletId diubah, pastikan outlet milik bisnis yang sama
    if (data.outletId && user.businessId) {
      const outlet = await userRepository.findOutletByIdAndBusiness(
        data.outletId,
        user.businessId,
      );
      if (!outlet) {
        throw new AppError('Outlet tidak ditemukan atau bukan milik bisnis ini', 404);
      }
    }

    if (data.roleId && user.businessId) {
      const isValidRole = await userRepository.verifyRoleBelongsToBusiness(data.roleId, user.businessId);
      if (!isValidRole) {
        throw new AppError('Role tidak valid atau bukan milik bisnis ini', 400);
      }
    }

    return userRepository.update(id, data);
  }

  /**
   * Hapus user (soft delete)
   * Admin hanya boleh hapus user di bisnis miliknya
   */
  async deleteUser(
    id: string,
    requesterRole: string,
    requesterBusinessId?: string | null,
    requesterOutletId?: string | null,
  ) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User tidak ditemukan', 404);

    if (requesterRole !== 'SUPER_ADMIN') {
      if (user.businessId !== requesterBusinessId) {
        throw new AppError('Anda tidak memiliki akses untuk menghapus user ini', 403);
      }
      if (requesterRole === 'ADMIN' && user.outletId !== requesterOutletId) {
        throw new AppError('Anda hanya dapat menghapus user di cabang Anda sendiri', 403);
      }
    }

    // Tidak boleh hapus diri sendiri
    await userRepository.softDelete(id);

    return { message: `User "${user.name}" berhasil dihapus` };
  }
}

export const userService = new UserService();
