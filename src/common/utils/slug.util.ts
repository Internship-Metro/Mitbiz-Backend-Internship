/**
 * src/common/utils/slug.util.ts
 *
 * TUJUAN: Generate URL-friendly slug dari nama bisnis.
 *
 * CARA PAKAI:
 *   generateSlug('Cafe Kita & Friends!')  → "cafe-kita-friends"
 *   generateSlug('Warung Bu Sri 2')       → "warung-bu-sri-2"
 *
 * Slug dipakai sebagai identifier tenant yang readable di URL:
 *   /api/v1/tenants/cafe-kita-friends
 */

/**
 * Convert nama menjadi slug URL-friendly
 * @param name - Nama asli (bisa mengandung spasi, simbol, huruf kapital)
 * @returns string - Slug yang aman untuk URL (huruf kecil, pisah dengan -)
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()                       // "Cafe Kita" → "cafe kita"
    .trim()                              // Hapus spasi di awal/akhir
    .replace(/[^\w\s-]/g, '')           // Hapus karakter bukan huruf/angka/spasi/dash
    .replace(/[\s_]+/g, '-')            // Ganti spasi/underscore dengan dash
    .replace(/-+/g, '-')                // Hilangkan double-dash (--) jadi satu (-)
    .replace(/^-+|-+$/g, '');           // Hapus dash di awal dan akhir
};
