/**
 * src/common/guards/roles.guard.ts
 *
 * TUJUAN: Middleware untuk membatasi akses endpoint berdasarkan role user.
 * HARUS digunakan SETELAH jwtAuthGuard (butuh req.user yang sudah diisi).
 *
 * CARA PAKAI di routes:
 *   // Hanya SUPER_ADMIN yang boleh akses
 *   router.get('/tenants', jwtAuthGuard, requireRoles('SUPER_ADMIN'), controller.findAll)
 *
 *   // ADMIN dan SUPER_ADMIN boleh akses
 *   router.post('/products', jwtAuthGuard, requireRoles('SUPER_ADMIN', 'ADMIN'), controller.create)
 *
 *   // ADMIN, KASIR, dan SUPER_ADMIN boleh akses
 *   router.get('/products', jwtAuthGuard, requireRoles('SUPER_ADMIN', 'ADMIN', 'KASIR'), controller.findAll)
 */

import { Request, Response, NextFunction } from 'express';
import { sendError } from '@common/utils/response.util';

/**
 * Factory function yang menghasilkan middleware untuk role checking
 * @param roles - Role yang diizinkan mengakses endpoint ini
 * @returns Express middleware
 */
export const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Pastikan jwtAuthGuard sudah dipasang sebelumnya (req.user harus ada)
    if (!req.user) {
      sendError(res, 'Autentikasi diperlukan', 401);
      return;
    }

    // Cek apakah role user ada di daftar role yang diizinkan
    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        `Akses ditolak. Hanya ${roles.join(' atau ')} yang dapat mengakses fitur ini.`,
        403,
      );
      return;
    }

    next(); // Role sesuai → lanjut ke handler
  };
};
