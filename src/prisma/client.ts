/**
 * src/prisma/client.ts
 *
 * TUJUAN: Singleton Prisma Client.
 * "Singleton" artinya hanya ada SATU instance PrismaClient di seluruh aplikasi.
 *
 * KENAPA PENTING:
 * Kalau setiap file buat `new PrismaClient()` sendiri → database kehabisan connection pool.
 * Dengan singleton → semua file pakai instance yang sama → efficient.
 *
 * CARA PAKAI: import { prisma } from '@/prisma/client'
 *             lalu: await prisma.user.findMany(...)
 */

import { PrismaClient } from '@prisma/client';
import { env } from '@config/env';

// Buat satu instance global
const prisma = new PrismaClient({
  // Log query hanya saat development — matikan di production untuk performa
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prisma };
