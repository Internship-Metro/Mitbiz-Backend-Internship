/**
 * src/tests/global-teardown.ts
 *
 * Dijalankan SEKALI setelah semua test suite selesai.
 * Tugasnya: bersihkan data test, tutup koneksi DB.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function globalTeardown() {
  console.log('\n🧹 [Test Teardown] Membersihkan data test...');

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
  console.log('✅ [Test Teardown] Selesai.\n');
}
