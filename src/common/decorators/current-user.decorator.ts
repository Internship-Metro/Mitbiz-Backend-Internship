/**
 * src/common/decorators/current-user.decorator.ts
 *
 * TUJUAN: Helper function untuk mengambil data user yang sedang login dari request.
 * Di Express, tidak ada "decorator" seperti NestJS — ini adalah helper function biasa.
 *
 * CARA PAKAI di controller:
 *   import { getCurrentUser } from '@common/decorators/current-user.decorator'
 *
 *   const user = getCurrentUser(req)   // Ambil user
 *   const { userId, role } = user      // Destructure langsung
 *
 * Fungsi ini juga validasi bahwa req.user ada (kalau tidak ada → throw 401)
 */

import { Request } from 'express';
import { JwtPayload } from '@common/utils/jwt.util';
import { AppError } from '@common/utils/app-error.util';

/**
 * Ambil data user yang sudah login dari request
 * @param req - Express Request object
 * @returns JwtPayload - Data user (userId, role, tenantId, branchId)
 * @throws AppError 401 jika req.user tidak ada (guard belum dipasang)
 */
export const getCurrentUser = (req: Request): JwtPayload => {
  if (!req.user) {
    throw new AppError('User tidak terautentikasi. Pastikan jwtAuthGuard dipasang di route ini.', 401);
  }
  return req.user;
};
