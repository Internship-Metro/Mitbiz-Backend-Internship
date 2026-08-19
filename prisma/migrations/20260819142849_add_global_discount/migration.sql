-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "business" ADD COLUMN     "globalDiscountMinPurchase" INTEGER,
ADD COLUMN     "globalDiscountPercentage" DOUBLE PRECISION,
ADD COLUMN     "isDiscountEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "globalDiscountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "globalDiscountPercentage" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "subscription_payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "businessId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "snapToken" TEXT,
    "redirectUrl" TEXT,
    "grossAmount" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentType" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payment_orderId_key" ON "subscription_payment"("orderId");

-- CreateIndex
CREATE INDEX "subscription_payment_businessId_idx" ON "subscription_payment"("businessId");

-- CreateIndex
CREATE INDEX "subscription_payment_orderId_idx" ON "subscription_payment"("orderId");

-- AddForeignKey
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "business_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
