-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'KASIR', 'OWNER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OutletStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StockAdjustmentType" AS ENUM ('IN', 'OUT', 'CORRECTION');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'VOIDED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKE_AWAY');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CASH', 'DEBIT', 'CREDIT', 'QRIS', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "business" (
    "id" TEXT NOT NULL,
    "businessCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessCategory" TEXT,
    "city" TEXT,
    "province" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "status" "BusinessStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "maxBranches" INTEGER NOT NULL DEFAULT 1,
    "maxKasir" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_feature" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_subscription" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outlet" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "status" "OutletStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "outletId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'KASIR',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatarUrl" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "emailVerificationToken" TEXT,
    "emailVerificationTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_blacklist" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "kasirId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openingCash" INTEGER NOT NULL DEFAULT 0,
    "closingCash" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustment" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "StockAdjustmentType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL DEFAULT 'CASH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outlet_payment_method" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outlet_payment_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "kasirId" TEXT NOT NULL,
    "shiftId" TEXT,
    "paymentMethodId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "orderType" "OrderType" NOT NULL DEFAULT 'DINE_IN',
    "subtotal" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "changeAmount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_item" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_setting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "appName" TEXT NOT NULL DEFAULT 'Mitbiz POS',
    "logoUrl" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'Indonesia',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_businessCode_key" ON "business"("businessCode");

-- CreateIndex
CREATE UNIQUE INDEX "business_slug_key" ON "business"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "package_name_key" ON "package"("name");

-- CreateIndex
CREATE INDEX "business_subscription_businessId_idx" ON "business_subscription"("businessId");

-- CreateIndex
CREATE INDEX "outlet_businessId_idx" ON "outlet"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_emailVerificationToken_key" ON "user"("emailVerificationToken");

-- CreateIndex
CREATE INDEX "user_businessId_idx" ON "user"("businessId");

-- CreateIndex
CREATE INDEX "user_outletId_idx" ON "user"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "token_blacklist_token_key" ON "token_blacklist"("token");

-- CreateIndex
CREATE INDEX "token_blacklist_userId_idx" ON "token_blacklist"("userId");

-- CreateIndex
CREATE INDEX "shift_outletId_idx" ON "shift"("outletId");

-- CreateIndex
CREATE INDEX "shift_kasirId_idx" ON "shift"("kasirId");

-- CreateIndex
CREATE INDEX "category_outletId_idx" ON "category"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "category_outletId_name_key" ON "category"("outletId", "name");

-- CreateIndex
CREATE INDEX "product_outletId_idx" ON "product"("outletId");

-- CreateIndex
CREATE INDEX "product_categoryId_idx" ON "product"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "product_outletId_sku_key" ON "product"("outletId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "stock_productId_key" ON "stock"("productId");

-- CreateIndex
CREATE INDEX "stock_outletId_idx" ON "stock"("outletId");

-- CreateIndex
CREATE INDEX "stock_adjustment_outletId_idx" ON "stock_adjustment"("outletId");

-- CreateIndex
CREATE INDEX "stock_adjustment_productId_idx" ON "stock_adjustment"("productId");

-- CreateIndex
CREATE INDEX "payment_method_businessId_idx" ON "payment_method"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_businessId_name_key" ON "payment_method"("businessId", "name");

-- CreateIndex
CREATE INDEX "outlet_payment_method_outletId_idx" ON "outlet_payment_method"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "outlet_payment_method_outletId_paymentMethodId_key" ON "outlet_payment_method"("outletId", "paymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_invoiceNumber_key" ON "transaction"("invoiceNumber");

-- CreateIndex
CREATE INDEX "transaction_outletId_idx" ON "transaction"("outletId");

-- CreateIndex
CREATE INDEX "transaction_kasirId_idx" ON "transaction"("kasirId");

-- CreateIndex
CREATE INDEX "transaction_shiftId_idx" ON "transaction"("shiftId");

-- CreateIndex
CREATE INDEX "transaction_createdAt_idx" ON "transaction"("createdAt");

-- CreateIndex
CREATE INDEX "transaction_item_transactionId_idx" ON "transaction_item"("transactionId");

-- CreateIndex
CREATE INDEX "transaction_item_productId_idx" ON "transaction_item"("productId");

-- AddForeignKey
ALTER TABLE "package_feature" ADD CONSTRAINT "package_feature_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_subscription" ADD CONSTRAINT "business_subscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_subscription" ADD CONSTRAINT "business_subscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlet" ADD CONSTRAINT "outlet_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_blacklist" ADD CONSTRAINT "token_blacklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift" ADD CONSTRAINT "shift_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift" ADD CONSTRAINT "shift_kasirId_fkey" FOREIGN KEY ("kasirId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment" ADD CONSTRAINT "stock_adjustment_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment" ADD CONSTRAINT "stock_adjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment" ADD CONSTRAINT "stock_adjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlet_payment_method" ADD CONSTRAINT "outlet_payment_method_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlet_payment_method" ADD CONSTRAINT "outlet_payment_method_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_kasirId_fkey" FOREIGN KEY ("kasirId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_item" ADD CONSTRAINT "transaction_item_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_item" ADD CONSTRAINT "transaction_item_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
