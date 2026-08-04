const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.tokenBlacklist.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.stockAdjustment.deleteMany({});
  await prisma.stock.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.branchPaymentMethod.deleteMany({});
  await prisma.paymentMethod.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenantSubscription.deleteMany({});
  await prisma.tenant.deleteMany({});
  console.log('Semua data dummy berhasil dihapus');
}

main()
  .catch(console.error)
  .finally(function() { return prisma.$disconnect(); });
