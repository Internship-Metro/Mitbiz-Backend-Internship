/**
 * src/common/utils/pagination.util.ts
 *
 * TUJUAN: Helper untuk menghitung parameter pagination dan membuat meta response.
 *
 * CARA PAKAI di repository:
 *   const { skip, take } = getPaginationParams(page, limit)
 *   await prisma.product.findMany({ skip, take })
 *
 * CARA PAKAI di controller:
 *   const meta = buildPaginationMeta(total, page, limit)
 *   sendSuccess(res, products, 'Berhasil', 200, meta)
 */

import { PAGINATION } from '@config/constants';

// Interface query params pagination yang dikirim dari frontend
export interface PaginationQuery {
  page?: number | string;
  limit?: number | string;
}

// Interface hasil kalkulasi untuk Prisma query
export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

/**
 * Parse dan hitung skip/take untuk Prisma dari query params frontend
 * @param rawPage - Nomor halaman (dari req.query.page)
 * @param rawLimit - Jumlah item per halaman (dari req.query.limit)
 * @returns { skip, take, page, limit }
 */
export const getPaginationParams = (
  rawPage?: number | string,
  rawLimit?: number | string,
): PaginationParams => {
  const page = Math.max(1, Number(rawPage) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, Number(rawLimit) || PAGINATION.DEFAULT_LIMIT),
  );
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
};

/**
 * Buat objek meta pagination untuk response frontend
 * @param total - Total semua data (dari prisma.model.count())
 * @param page - Halaman yang sedang diakses
 * @param limit - Jumlah item per halaman
 * @returns Meta object { total, page, limit, totalPages }
 */
export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
