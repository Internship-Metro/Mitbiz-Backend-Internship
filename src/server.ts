/**
 * src/server.ts
 *
 * TUJUAN: Entry point aplikasi — jalankan HTTP server di port yang dikonfigurasi.
 * Ini adalah file yang dijalankan pertama kali oleh Node.js.
 *
 * Yang dilakukan:
 * 1. Import app dari app.ts
 * 2. Koneksi ke database (prisma)
 * 3. Start server di port dari env
 * 4. Handle graceful shutdown (SIGTERM/SIGINT) — tutup koneksi DB saat server dihentikan
 *
 * CARA JALANKAN:
 *   npm run dev   → development (auto-restart dengan ts-node-dev)
 *   npm start     → production (jalankan dari dist/ setelah build)
 */

import { app } from './app';
import { env } from '@config/env';
import { prisma } from './prisma/client';
import { registerCleanupJobs } from '@common/jobs/cleanup.job';

const PORT = env.PORT;

// Fungsi utama — jalankan di dalam async function agar bisa await
const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log(`[DB]     Connected to database`);

    app.listen(PORT, () => {
      console.log(`[Server] Mitbiz Backend running on http://localhost:${PORT}`);
      console.log(`[Server] Environment : ${env.NODE_ENV}`);
      console.log(`[Server] API Base URL : http://localhost:${PORT}/api/v1`);

      // Daftarkan semua background jobs (cleanup, dll)
      registerCleanupJobs();
    });
  } catch (error) {
    console.error(`[Server] Failed to start:`, error);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────
// Saat server dihentikan (Ctrl+C atau deployment restart) → tutup koneksi DB dengan benar
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`[Server] ${signal} received. Shutting down...`);
  await prisma.$disconnect();
  console.log(`[DB]     Connection closed`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Jalankan server
startServer();
