/**
 * src/common/pipes/zod-validation.pipe.ts
 *
 * TUJUAN: Middleware factory untuk validasi request body menggunakan Zod schema.
 * "Pipe" = proses data sebelum masuk ke controller.
 *
 * CARA PAKAI di routes:
 *   import { validate } from '@common/pipes/zod-validation.pipe'
 *   import { LoginDto } from './dto/login.dto'
 *
 *   router.post('/login', validate(LoginDto), authController.login)
 *   // Setelah middleware ini → req.body sudah tervalidasi dan ter-type dengan benar
 *
 * Kalau validasi gagal → langsung balas 400 dengan daftar field yang salah.
 * Controller tidak akan dipanggil sama sekali.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '@common/utils/response.util';

/**
 * Factory function — buat middleware validasi dari Zod schema
 * @param schema - Zod schema untuk validasi (dari dto/*.dto.ts)
 * @param target - Bagian request yang divalidasi (default: 'body')
 */
export const validate = (
  schema: ZodSchema,
  target: 'body' | 'query' | 'params' = 'body',
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      // result.error adalah ZodError — .issues selalu ada berisi array detail error
      const issues = (result.error as any)?.issues ?? (result.error as any)?.errors ?? [];
      const errors = issues.map((err: any) => ({
        field: Array.isArray(err.path) ? err.path.join('.') : String(err.path ?? ''),
        message: err.message ?? 'Validasi gagal',
      }));

      sendError(res, 'Input tidak valid', 400, errors);
      return;
    }

    // Validasi sukses → ganti req[target] dengan data yang sudah bersih dari Zod
    // (Zod bisa strip unknown fields dan transform values)
    req[target] = result.data;
    next();
  };
};
