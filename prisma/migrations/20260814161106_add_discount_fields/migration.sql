/*
  Warnings:

  - A unique constraint covering the columns `[productId,outletId]` on the table `stock` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "stock_productId_key";

-- AlterTable
ALTER TABLE "business" ADD COLUMN     "discountProductIds" TEXT[],
ADD COLUMN     "maxDiscountNominal" INTEGER;

-- AlterTable
ALTER TABLE "system_setting" ALTER COLUMN "timezone" SET DEFAULT 'GMT +7 Jakarta',
ALTER COLUMN "currency" SET DEFAULT 'Rupiah (IDR)';

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "tableNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "stock_productId_outletId_key" ON "stock"("productId", "outletId");
