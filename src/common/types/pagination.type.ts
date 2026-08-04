/**
 * src/common/types/pagination.type.ts
 *
 * TUJUAN: Tipe TypeScript untuk pagination — dipakai di repository dan controller.
 *
 * CARA PAKAI:
 *   function findAll(params: PaginatedRequest): Promise<PaginatedResult<Product>>
 */

// Query params pagination yang diterima dari frontend
export interface PaginatedRequest {
  page?: number;
  limit?: number;
  search?: string;
}

// Struktur result dari repository yang include pagination
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
