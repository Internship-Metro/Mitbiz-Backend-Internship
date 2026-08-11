/**
 * src/common/guards/jwt-auth.guard.ts
 *
 * TUJUAN: Middleware untuk melindungi endpoint yang butuh login.
 * Pasang di route yang membutuhkan autentikasi.
 *
 * 1. Baca dari cookie: req.cookies.accessToken
 * 2. Verifikasi signature JWT
 * 3. Cek apakah token ada di token_blacklist (sudah logout)
 * 4. Kalau valid → simpan payload ke req.user → lanjut ke handler berikutnya
 * 5. Kalau tidak valid → langsung balas 401 Unauthorized
 *
 * CARA PAKAI di routes:
 *   router.get('/me', jwtAuthGuard, controller.getMe)
 *   router.use(jwtAuthGuard)  // terapkan ke semua route di bawahnya
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@common/utils/jwt.util';
import { sendError } from '@common/utils/response.util';
import { prisma } from '@/prisma/client';
import { AUTH } from '@config/constants';
import { AppError } from '@common/utils/app-error.util';

export const jwtAuthGuard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Ambil token dari header atau cookies
    let token = req.cookies.accessToken;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      sendError(res, 'Token tidak ditemukan. Silakan login terlebih dahulu.', 401);
      return;
    }

    // 3. Verifikasi signature dan expiry
    const payload = verifyToken(token);

    // 4. Cek apakah token sudah di-blacklist (user sudah logout)
    const blacklisted = await prisma.tokenBlacklist.findUnique({
      where: { token },
    });
    if (blacklisted) {
      sendError(res, 'Token sudah tidak berlaku. Silakan login ulang.', 401);
      return;
    }

    // 5. Cek status akun user (HARUS ACTIVE)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { status: true },
    });
    
    if (!user) {
      sendError(res, 'Akun tidak ditemukan.', 401);
      return;
    }

    if (user.status !== 'ACTIVE') {
      sendError(res, 'Akun belum aktif atau email belum diverifikasi.', 403);
      return;
    }

    // 6. Token valid & user ACTIVE → simpan payload ke req.user
    req.user = payload;

    next(); // Lanjut ke handler berikutnya
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        sendError(res, 'Token sudah expired. Silakan login ulang.', 401);
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        sendError(res, 'Token tidak valid.', 401);
        return;
      }
    }
    // Error lain yang tidak terduga
    console.error('JWT Error:', error);
    next(new AppError('Autentikasi gagal', 401));
  }
};
