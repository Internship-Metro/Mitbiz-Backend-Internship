/**
 * src/common/types/express.d.ts
 *
 * TUJUAN: Extend tipe Express Request agar bisa menyimpan data user yang sudah login.
 * Setelah JWT guard verifikasi token → data user disimpan ke req.user
 * Supaya TypeScript tidak error saat kita akses req.user, kita declare di sini.
 *
 * CARA PAKAI (setelah pasang jwtAuthGuard di route):
 *   const { userId, role } = req.user!
 */

import { JwtPayload } from '@common/utils/jwt.util';

// Extend Express namespace — TypeScript akan merge ini dengan tipe Express aslinya
declare global {
  namespace Express {
    interface Request {
      /**
       * Data user yang sudah login.
       * Di-set oleh jwtAuthGuard setelah token berhasil diverifikasi.
       * Undefined di route yang tidak pakai jwtAuthGuard.
       */
      user?: JwtPayload;
    }
  }
}
