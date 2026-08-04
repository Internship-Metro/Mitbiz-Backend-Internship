/**
 * src/common/middlewares/multer.middleware.ts
 *
 * TUJUAN: Konfigurasi Multer untuk parse file upload dari frontend.
 * Multer membaca multipart/form-data dan taruh file di req.file.
 *
 * Konfigurasi yang kita pakai:
 * - memoryStorage: file disimpan di RAM (buffer), TIDAK ke disk
 *   → lebih cepat, lebih bersih (tidak perlu cleanup file temp)
 *   → cocok karena file langsung di-pipe ke Cloudinary
 *
 * Batasan:
 * - Format: JPEG, PNG, WebP saja
 * - Ukuran: maksimal 2MB
 *
 * CARA PAKAI di routes:
 *   router.post('/upload-image', jwtAuthGuard, uploadSingle, controller.uploadImage)
 *   // Setelah middleware ini jalan → req.file berisi file yang diupload
 */

import multer from 'multer';
import { AppError } from '@common/utils/app-error.util';
import { UPLOAD } from '@config/constants';

// Simpan di RAM (buffer) — tidak ditulis ke disk
const storage = multer.memoryStorage();

// Validasi tipe file — tolak selain gambar
const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);  // Terima file
  } else {
    callback(
      new AppError(
        `Format file tidak didukung. Gunakan: ${UPLOAD.ALLOWED_MIME_TYPES.join(', ')}`,
        400,
      ),
    );
  }
};

// Instance multer dengan konfigurasi lengkap
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD.MAX_FILE_SIZE, // 2MB
  },
});

/**
 * Middleware untuk upload satu file dengan field name "image"
 * Field name "image" harus sama dengan yang dikirim frontend di form-data
 */
export const uploadSingle = upload.single('image');
