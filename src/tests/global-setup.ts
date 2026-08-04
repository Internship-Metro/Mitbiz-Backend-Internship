/**
 * src/tests/global-setup.ts
 *
 * Dijalankan SEKALI sebelum semua test suite.
 * Tugasnya: koneksi ke database, bersihkan data test yang mungkin tertinggal.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function globalSetup() {
  console.log('\n🧹 [Test Setup] Membersihkan database untuk test...');

  // Hapus data yang mungkin tertinggal dari test sebelumnya
  // Urutan penghapusan harus menghormati relasi (hapus child dulu baru parent)
  await prisma.stockAdjustment.deleteMany();
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tokenBlacklist.deleteMany();
  await prisma.outletPaymentMethod.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.user.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.businessSubscription.deleteMany();
  await prisma.business.deleteMany();

  await prisma.$disconnect();
  console.log('✅ [Test Setup] Database siap untuk test.\n');
}
