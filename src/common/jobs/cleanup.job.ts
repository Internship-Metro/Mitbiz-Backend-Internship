/**
 * src/common/jobs/cleanup.job.ts
 *
 * TUJUAN: Menjalankan tugas pembersihan otomatis setiap jam:
 *   1. Hapus akun INACTIVE yang sudah lebih dari 24 jam tidak diverifikasi
 *   2. Hapus token blacklist yang sudah kadaluarsa
 *
 * Dijalankan menggunakan node-cron (cron expression: setiap jam tepat)
 */

import cron from 'node-cron';
import { authRepository } from '@modules/auth/auth.repository';
import { prisma } from '@/prisma/client';

const INACTIVE_USER_TTL_HOURS = 24; // Hapus akun INACTIVE setelah 24 jam

/**
 * Hapus akun INACTIVE yang sudah lebih dari 24 jam tidak diverifikasi
 */
async function cleanupInactiveUsers(): Promise<void> {
  try {
    const count = await authRepository.deleteExpiredInactiveUsers(INACTIVE_USER_TTL_HOURS);
    if (count > 0) {
      console.log(`[Cleanup] Berhasil menghapus ${count} akun INACTIVE yang kadaluarsa (> ${INACTIVE_USER_TTL_HOURS} jam)`);
    }
  } catch (error) {
    console.error('[Cleanup] Error saat menghapus akun INACTIVE:', error);
  }
}

/**
 * Hapus token blacklist yang sudah melewati tanggal kadaluarsanya
 */
async function cleanupExpiredTokens(): Promise<void> {
  try {
    const result = await prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      console.log(`[Cleanup] Berhasil menghapus ${result.count} blacklisted token yang kadaluarsa`);
    }
  } catch (error) {
    console.error('[Cleanup] Error saat menghapus expired tokens:', error);
  }
}

/**
 * Daftarkan semua cron jobs
 * Dipanggil sekali saat server pertama kali start (di server.ts)
 */
export function registerCleanupJobs(): void {
  // Jalankan setiap jam tepat (misal: 01:00, 02:00, 03:00, dst.)
  // Lebih presisi untuk TTL 24 jam dibanding hanya jalan sekali sehari
  cron.schedule('0 * * * *', async () => {
    await cleanupInactiveUsers();
    await cleanupExpiredTokens();
  });

  console.log('[Jobs]   Cleanup job terdaftar (berjalan setiap jam)');
}

