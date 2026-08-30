/**
 * src/config/env.ts
 *
 * TUJUAN: Validasi semua environment variable saat server pertama kali start.
 * Kalau ada env yang kurang atau salah format → server langsung crash dengan
 * pesan error yang jelas, daripada crash di tengah-tengah dengan error membingungkan.
 *
 * CARA PAKAI: import { env } from '@config/env'
 *             lalu akses: env.DATABASE_URL, env.JWT_SECRET, dst.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load file .env ke process.env sebelum divalidasi
dotenv.config();

// Schema validasi semua env variable yang dibutuhkan
const envSchema = z.object({
  // ─── Server ───────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),

  // ─── Database ─────────────────────────────────────────────
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),

  // ─── JWT ──────────────────────────────────────────────────
  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter untuk keamanan'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // ─── Bcrypt ───────────────────────────────────────────────
  BCRYPT_SALT_ROUNDS: z.string().default('10').transform(Number),

  // ─── CORS ─────────────────────────────────────────────────
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),

  // ─── Cloudinary ───────────────────────────────────────────
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME wajib diisi'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY wajib diisi'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET wajib diisi'),

  // ─── Email (Mailtrap HTTP API) ────────────────────────────────────
  // Mailtrap SDK transport dipakai — bekerja via HTTPS (port 443),
  // tidak terkena blokir Railway (tidak seperti SMTP port 25/465/587/2525).
  // Email tertangkap di virtual inbox Mailtrap untuk testing.
  MAILTRAP_API_TOKEN: z.string().min(1, 'MAILTRAP_API_TOKEN wajib diisi'),
  MAILTRAP_INBOX_ID: z.string().default('4828197').transform(Number),
  EMAIL_FROM: z.string().default('noreply@mitbiz.com'),
  APP_URL: z.string().default('http://localhost:3000'), // Base URL untuk link verifikasi

  // ─── Midtrans ────────────────────────────────────────────
  MIDTRANS_SERVER_KEY: z.string().min(1, 'MIDTRANS_SERVER_KEY wajib diisi'),
  MIDTRANS_CLIENT_KEY: z.string().min(1, 'MIDTRANS_CLIENT_KEY wajib diisi'),
  MIDTRANS_MERCHANT_ID: z.string().min(1, 'MIDTRANS_MERCHANT_ID wajib diisi'),
  MIDTRANS_IS_PRODUCTION: z.string().default('false'),
});


// Jalankan validasi — kalau gagal, tampilkan semua error lalu hentikan proses
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ ENV VALIDATION FAILED — periksa file .env kamu:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1); // Hentikan server
}

// Export env yang sudah tervalidasi & ter-type dengan benar
export const env = parsed.data;
