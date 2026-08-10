import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '@common/utils/response.util';
import { AppError } from '@common/utils/app-error.util';

export class AuthController {
  
  async registerStep1(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const result = await authService.registerStep1(data);
      
      const { accessToken, refreshToken } = result.tokens;
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' });
      
      // Kembalikan token di response body agar bisa dicopy untuk test Step 2 dan 3 di Scalar
      sendSuccess(res, { user: result.user, tokens: result.tokens }, 'Berhasil membuat profil akun. Silakan lanjut ke Step 2 untuk mendaftarkan bisnis.', 201);
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
      if (!token) {
        return next(new Error('Token verifikasi tidak ditemukan'));
      }
      const result = await authService.verifyEmail(token);
      
      const { accessToken, refreshToken } = result.tokens;
      
      // Cookie dikembalikan ke aturan awal (ketat) untuk keamanan produksi
      const isProd = process.env.NODE_ENV === 'production';
      const cookieOptions = { httpOnly: true, secure: isProd, sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax' };
      res.cookie('accessToken', accessToken, cookieOptions);
      res.cookie('refreshToken', refreshToken, cookieOptions);
      
      // KITA KEMBALIKAN TOKEN KE DALAM BODY SUPAYA SCALAR BISA BACA
      sendSuccess(res, { user: result.user, tokens: result.tokens }, 'Email berhasil diverifikasi! Akun kamu sudah aktif, silakan login.');
    } catch (error) {
      next(error);
    }
  }

  async registerStep2(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user diset oleh jwtAuthGuard
      const userId = req.user!.userId;
      const data = req.body;
      const result = await authService.registerStep2(userId, data);
      sendSuccess(res, result, 'Berhasil mendaftarkan bisnis (Step 2 selesai)', 201);
    } catch (error) {
      next(error);
    }
  }

  async registerStep3(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const data = req.body;
      const result = await authService.registerStep3(userId, data);
      sendSuccess(res, result, 'Berhasil mendaftarkan cabang (Step 3 selesai)', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const result = await authService.login(data);
      
      const isProd = process.env.NODE_ENV === 'production';
      const cookieOptions = { httpOnly: true, secure: isProd, sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax' };
      
      if (result.requiresRegistration && result.registrationToken) {
        res.cookie('registrationToken', result.registrationToken, cookieOptions);
        // Tetap kirim registrationToken di response body
        return sendSuccess(res, result, result.message);
      }
      
      const { accessToken, refreshToken } = result.tokens!;
      res.cookie('accessToken', accessToken, cookieOptions);
      res.cookie('refreshToken', refreshToken, cookieOptions);
      
      // KITA KEMBALIKAN TOKEN KE DALAM BODY SUPAYA SCALAR BISA BACA
      sendSuccess(res, result, 'Login berhasil');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user diset oleh guard
      const userId = req.user!.userId;
      
      // Bisa jadi logout saat punya accessToken ATAU registrationToken
      const token = req.cookies.accessToken || req.cookies.registrationToken;
      
      if (token) {
        await authService.logout(token, userId);
      }
      
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.clearCookie('registrationToken');
      
      sendSuccess(res, null, 'Logout berhasil');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const data = req.body;
      
      await authService.changePassword(userId, data);
      sendSuccess(res, null, 'Password berhasil diubah');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await authService.getMe(userId);
      sendSuccess(res, user, 'Berhasil mendapatkan data user');
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        return next(new AppError('Email wajib diisi', 400));
      }
      const result = await authService.resendVerificationEmail(email);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        return next(new AppError('Refresh token tidak ditemukan di cookies atau body', 401));
      }
      const result = await authService.refreshAccessToken(refreshToken);
      
      const isProd = process.env.NODE_ENV === 'production';
      const cookieOptions = { httpOnly: true, secure: isProd, sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax' };
      res.cookie('accessToken', result.accessToken, cookieOptions);
      
      sendSuccess(res, { tokens: { accessToken: result.accessToken } }, 'Access token berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /register/cancel
   * Batalkan registrasi yang belum selesai.
   * Hanya bisa dilakukan pada akun INACTIVE (belum verifikasi email).
   * Auth: registrationGuard (butuh JWT dari step 1)
   */
  async cancelRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      await authService.cancelRegistration(userId);

      // Hapus cookies JWT agar frontend tidak menyimpan token registrasi yang sudah tidak valid
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      sendSuccess(res, null, 'Registrasi berhasil dibatalkan. Semua data pendaftaran telah dihapus.');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
