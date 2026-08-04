/**
 * src/common/utils/app-error.util.ts
 *
 * TUJUAN: Custom error class yang membawa HTTP status code.
 * Error biasa (new Error()) tidak punya statusCode — AppError punya.
 *
 * CARA PAKAI:
 *   throw new AppError('User tidak ditemukan', 404)
 *   throw new AppError('Email sudah digunakan', 409)
 *   throw new AppError('Akses ditolak', 403)
 *
 * Nanti di http-exception.filter.ts, kita tangkap AppError ini dan
 * kirim response dengan statusCode yang sesuai.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true, // true = error yang kita sengaja throw (bukan bug)
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Perbaiki prototype chain agar instanceof AppError bisa berjalan dengan benar di TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
