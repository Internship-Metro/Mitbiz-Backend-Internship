/**
 * src/common/guards/registration-guard.ts
 *
 * TUJUAN: Guard khusus untuk endpoint register Step 2 & Step 3.
 *
 * Menerima DUA jenis token:
 * - type: 'access'       → token dari Step 1 registrasi normal
 * - type: 'registration' → token short-lived 1 jam dari endpoint login
 *                          (untuk user yang resume registrasi)
 *
 * Menolak:
 * - type: 'refresh'      → refresh token tidak boleh akses endpoint ini
 * - Token tanpa type     → token lama / tidak valid
 *
 * CARA PAKAI di routes:
 *   router.post('/register/step2', registrationGuard, controller.step2)
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@common/utils/jwt.util';
import { sendError } from '@common/utils/response.util';
import { prisma } from '@/prisma/client';
import { AUTH } from '@config/constants';
import { AppError } from '@common/utils/app-error.util';

export const registrationGuard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Ambil token dari header atau cookies
    let token = req.cookies.accessToken || req.cookies.registrationToken;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      sendError(res, 'Token tidak ditemukan. Silakan login terlebih dahulu.', 401);
      return;
    }

    // 3. Verifikasi signature dan expiry
    const payload = verifyToken(token);

    // 4. Hanya izinkan token tipe 'access' atau 'registration'
    if (payload.type !== 'access' && payload.type !== 'registration') {
      sendError(res, 'Token tidak valid untuk endpoint ini.', 401);
      return;
    }

    // 5. Cek blacklist
    const blacklisted = await prisma.tokenBlacklist.findUnique({ where: { token } });
    if (blacklisted) {
      sendError(res, 'Token sudah tidak berlaku. Silakan login ulang.', 401);
      return;
    }

    // 6. Token valid — simpan payload ke req.user
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        sendError(
          res,
          'Token pendaftaran sudah kadaluarsa (1 jam). Silakan login kembali untuk melanjutkan pendaftaran.',
          401,
        );
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        sendError(res, 'Token tidak valid.', 401);
        return;
      }
    }
    next(new AppError('Autentikasi gagal', 401));
  }
};
