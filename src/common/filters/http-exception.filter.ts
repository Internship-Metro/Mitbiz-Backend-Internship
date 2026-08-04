/**
 * src/common/filters/http-exception.filter.ts
 *
 * TUJUAN: Global error handler — menangkap SEMUA error yang tidak tertangkap
 * di controller/service dan mengubahnya menjadi response JSON yang rapi.
 *
 * Di Express, error handler punya 4 parameter: (err, req, res, next)
 * Harus dipasang TERAKHIR di app.ts (setelah semua route).
 *
 * Cara kerja:
 * - AppError (throw kita sendiri) → gunakan statusCode dan message dari error
 * - Error lain (bug, db error, dll) → 500 Internal Server Error
 * - Di development: tampilkan stack trace untuk debugging
 * - Di production: sembunyikan detail teknis dari user
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/utils/app-error.util';
import { sendError } from '@common/utils/response.util';
import { env } from '@config/env';
import { ZodError } from 'zod';

export const httpExceptionFilter = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction, // harus ada parameter ini meski tidak dipakai — ini signature Express error handler
): void => {
  // Log semua error ke console untuk debugging (bisa diganti dengan logger Winston)
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // AppError = error yang sengaja kita throw (operasional, bukan bug)
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // ZodError = error validasi input dari user
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validasi input gagal', 400, formattedErrors);
    return;
  }

  // MulterError = error saat upload file (misal: file terlalu besar)
  if (err.name === 'MulterError') {
    const multerErr = err as unknown as { code: string; message: string };
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'Ukuran gambar terlalu besar (Maks 2MB)', 400);
      return;
    }
    sendError(res, multerErr.message, 400);
    return;
  }

  // Prisma error — record tidak ditemukan
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as unknown as { code: string };
    if (prismaErr.code === 'P2025') {
      sendError(res, 'Data tidak ditemukan', 404);
      return;
    }
    if (prismaErr.code === 'P2002') {
      sendError(res, 'Data sudah ada (duplikat)', 409);
      return;
    }
  }

  // Error tidak terduga (bug) → 500, sembunyikan detail di production
  const message =
    env.NODE_ENV === 'development'
      ? err.message
      : 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.';

  sendError(res, message, 500);
};
