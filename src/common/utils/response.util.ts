/**
 * src/common/utils/response.util.ts
 *
 * TUJUAN: Memastikan semua response dari API punya format yang SAMA PERSIS.
 * Konsistensi format penting agar frontend tidak bingung.
 *
 * Format standar yang disepakati:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: any,
 *   meta?: { total, page, limit, totalPages }  // hanya untuk list
 * }
 *
 * CARA PAKAI:
 *   sendSuccess(res, user, 'Login berhasil')
 *   sendSuccess(res, products, 'Berhasil', 200, paginationMeta)
 *   sendError(res, 'Email tidak ditemukan', 404)
 */

import { Response } from 'express';

// Interface untuk meta pagination (dipakai di endpoint list)
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Kirim response sukses
 * @param res - Express Response object
 * @param data - Data yang dikembalikan ke client
 * @param message - Pesan sukses
 * @param statusCode - HTTP status (default: 200)
 * @param meta - Meta pagination (opsional, hanya untuk list data)
 */
export const sendSuccess = (
  res: Response,
  data: unknown,
  message: string = 'Berhasil',
  statusCode: number = 200,
  meta?: PaginationMeta,
): Response => {
  const response: Record<string, unknown> = {
    success: true,
    message,
    data,
  };

  // Hanya tambahkan meta kalau ada (endpoint list)
  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Kirim response error
 * @param res - Express Response object
 * @param message - Pesan error
 * @param statusCode - HTTP status (default: 500)
 * @param errors - Array detail error per field (opsional, untuk 400 validasi)
 */
export const sendError = (
  res: Response,
  message: string = 'Terjadi kesalahan',
  statusCode: number = 500,
  errors?: Array<{ field: string; message: string }>,
): Response => {
  const response: Record<string, unknown> = {
    success: false,
    message,
  };

  // Hanya tambahkan errors kalau ada (validasi input gagal)
  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
