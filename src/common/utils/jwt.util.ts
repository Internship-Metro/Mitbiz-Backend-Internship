/**
 * src/common/utils/jwt.util.ts
 *
 * TUJUAN: Fungsi helper untuk generate dan verifikasi JWT token.
 *
 * Dua jenis token:
 * - Access Token  : berlaku singkat (default 15m / 1h dari env), untuk akses API
 * - Refresh Token : berlaku sedang (7 hari), hanya untuk memperbarui access token
 *
 * CARA PAKAI:
 *   const token = signToken({ userId: 'clx123', role: 'ADMIN' })
 *   const payload = verifyToken(token)  // { userId, role, iat, exp }
 */

import jwt from 'jsonwebtoken';
import { env } from '@config/env';

// Interface isi payload JWT yang kita simpan di dalam token
export interface JwtPayload {
  userId: string;
  role: string;
  businessId?: string | null;
  outletId?: string | null;
  // customPermissions: matriks CRUD per menu untuk STAFF
  // Format: { "MENU_CABANG": { canCreate: true, canRead: true, canUpdate: false, canDelete: false }, ... }
  customPermissions?: Record<string, Record<string, boolean>>;
  type?: 'access' | 'refresh' | 'registration'; // registration: token 1 jam khusus resume pendaftaran
}

// Interface payload setelah di-decode (tambahan field dari JWT: iat, exp)
export interface DecodedToken extends JwtPayload {
  iat: number; // issued at — kapan token dibuat (Unix timestamp)
  exp: number; // expiry — kapan token expired (Unix timestamp)
}

/**
 * Generate ACCESS token (berlaku singkat — default 1 jam dari env)
 */
export const signToken = (payload: Omit<JwtPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
};

/**
 * Generate REFRESH token (berlaku 7 hari)
 * Hanya digunakan untuk memperbarui access token
 */
export const signRefreshToken = (payload: Omit<JwtPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Generate REGISTRATION token (berlaku 1 jam)
 * Hanya valid untuk melanjutkan Step 2 / Step 3 registrasi yang terputus
 */
export const signRegistrationToken = (payload: Omit<JwtPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'registration' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Verifikasi dan decode JWT token (access atau refresh)
 * @param token - Token string dari header Authorization atau body
 * @returns DecodedToken - Payload yang tersimpan di dalam token
 * @throws JsonWebTokenError jika token invalid
 * @throws TokenExpiredError jika token sudah expired
 */
export const verifyToken = (token: string): DecodedToken => {
  return jwt.verify(token, env.JWT_SECRET) as DecodedToken;
};
