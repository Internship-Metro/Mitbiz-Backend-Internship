/**
 * src/common/utils/cloudinary.util.ts
 *
 * TUJUAN: Helper untuk upload dan hapus gambar ke Cloudinary cloud storage.
 *
 * Alur upload:
 * 1. Frontend kirim file via multipart/form-data
 * 2. Multer middleware parse file → taruh di req.file (buffer di RAM)
 * 3. Controller panggil uploadToCloudinary(req.file)
 * 4. Cloudinary simpan gambar → kembalikan URL
 * 5. Backend simpan URL itu ke database
 *
 * CARA PAKAI:
 *   const imageUrl = await uploadToCloudinary(req.file, CLOUDINARY.PRODUCT_FOLDER)
 *   → "https://res.cloudinary.com/mitbiz/image/upload/v1234/mitbiz/products/abc.jpg"
 *
 *   await deleteFromCloudinary('mitbiz/products/abc')
 */

import { v2 as cloudinary } from 'cloudinary';
import { env } from '@config/env';
import { AppError } from './app-error.util';

// Konfigurasi Cloudinary — dipanggil sekali saat modul pertama kali di-import
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file gambar ke Cloudinary
 * @param file - File object dari Multer (req.file)
 * @param folder - Folder tujuan di Cloudinary (dari CLOUDINARY constants)
 * @returns Promise<string> - URL gambar yang bisa langsung disimpan ke DB
 */
export const uploadToCloudinary = (
  file: Express.Multer.File,
  folder: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Gunakan upload_stream karena file ada di buffer (memoryStorage), bukan di disk
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Kompresi otomatis untuk hemat bandwidth
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError('Gagal upload gambar ke Cloudinary', 500));
          return;
        }
        resolve(result.secure_url); // Kembalikan URL HTTPS
      },
    );

    // Kirim buffer file ke stream upload
    uploadStream.end(file.buffer);
  });
};

/**
 * Hapus gambar dari Cloudinary (saat produk/user dihapus)
 * @param publicId - Public ID gambar di Cloudinary
 *                   (bagian dari URL setelah /upload/vXXXX/ tanpa ekstensi)
 *                   Contoh: "mitbiz/products/abc123"
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

/**
 * Ekstrak public ID dari URL Cloudinary
 * Berguna saat ingin hapus gambar lama sebelum upload yang baru
 * @param url - URL lengkap dari Cloudinary
 * @returns string - Public ID (untuk dikirim ke deleteFromCloudinary)
 */
export const extractPublicId = (url: string): string => {
  // URL format: https://res.cloudinary.com/cloud/image/upload/v1234/folder/filename.ext
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  // Ambil semua bagian setelah /upload/vXXXX/ dan hapus ekstensi file
  const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
  return publicIdWithExt.replace(/\.[^/.]+$/, ''); // Hapus ekstensi (.jpg, .png, dst)
};
