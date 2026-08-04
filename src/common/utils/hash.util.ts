/**
 * src/common/utils/hash.util.ts
 *
 * TUJUAN: Fungsi helper untuk hash & verifikasi password menggunakan bcrypt.
 * Password TIDAK BOLEH disimpan plain text di database.
 *
 * CARA PAKAI:
 *   const hashed = await hashPassword('password123')
 *   → "$2b$10$N9qo8uLOickgx2ZMRZoMy..."  ← yang disimpan ke DB
 *
 *   const isMatch = await comparePassword('password123', hashedFromDB)
 *   → true atau false
 */

import bcrypt from 'bcryptjs';
import { env } from '@config/env';

/**
 * Hash password plain text menjadi bcrypt hash
 * @param plainPassword - Password asli dari user (belum di-hash)
 * @returns Promise<string> - bcrypt hash yang aman untuk disimpan di DB
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  return bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
};

/**
 * Bandingkan password plain text dengan hash yang tersimpan di DB
 * @param plainPassword - Password yang diinput user saat login
 * @param hashedPassword - Hash yang tersimpan di database
 * @returns Promise<boolean> - true jika cocok, false jika tidak
 */
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
