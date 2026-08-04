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
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      sendSuccess(res, { user: result.user }, 'Berhasil membuat akun. Cek email untuk verifikasi.', 201);
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
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      sendSuccess(res, { user: result.user }, 'Email berhasil diverifikasi! Akun kamu sudah aktif, silakan login.');
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
      
      if (result.requiresRegistration) {
        res.cookie('registrationToken', result.registrationToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        const { registrationToken, ...rest } = result;
        return sendSuccess(res, rest, result.message);
      }
      
      const { accessToken, refreshToken } = result.tokens!;
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      const { tokens, ...safeResult } = result;
      sendSuccess(res, safeResult, 'Login berhasil');
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
      
      res.cookie('accessToken', result.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
      
      sendSuccess(res, { tokens: { accessToken: result.accessToken } }, 'Access token berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
