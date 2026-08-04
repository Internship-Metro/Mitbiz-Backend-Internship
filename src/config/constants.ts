/**
 * src/config/constants.ts
 *
 * TUJUAN: Menyimpan semua "magic number" dan konstanta global di satu tempat.
 * Daripada nulis angka/string langsung di kode (hardcode), import dari sini.
 *
 * Keuntungan: kalau mau ubah nilai, cukup ubah di sini — berlaku ke seluruh project.
 *
 * CARA PAKAI: import { PAGINATION } from '@config/constants'
 */

// ─── Pagination ──────────────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100, // Batas atas — cegah user minta 999999 data sekaligus
} as const;

// ─── Cloudinary ──────────────────────────────────────────────────────────────
export const CLOUDINARY = {
  PRODUCT_FOLDER: 'mitbiz/products',  // Folder di Cloudinary untuk foto produk
  AVATAR_FOLDER: 'mitbiz/avatars',    // Folder di Cloudinary untuk foto profil user
  LOGO_FOLDER: 'mitbiz/logos',        // Folder di Cloudinary untuk logo tenant
} as const;

// ─── Upload ──────────────────────────────────────────────────────────────────
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,          // 5MB dalam bytes
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
} as const;

// ─── Token / Auth ────────────────────────────────────────────────────────────
export const AUTH = {
  BEARER_PREFIX: 'Bearer ',  // Prefix di header Authorization
} as const;

// ─── Invoice ─────────────────────────────────────────────────────────────────
export const INVOICE = {
  PREFIX: 'INV',             // Prefix nomor invoice: INV/2026/07/00001
  PADDING_LENGTH: 5,         // Angka urutan dipad jadi 5 digit: 00001, 00042, dst
} as const;
