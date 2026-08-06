const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const product = await prisma.product.findUnique({
    where: { id: 'cmscjnxlz00014hffu0bh1pkd' }
  });
  console.log(product);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
