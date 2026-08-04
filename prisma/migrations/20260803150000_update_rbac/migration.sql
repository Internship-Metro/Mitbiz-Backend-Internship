-- CreateEnum
CREATE TYPE "MenuPermission" AS ENUM ('MENU_DASHBOARD', 'MENU_REPORT', 'MENU_CABANG', 'MENU_STAFF', 'MENU_PRODUCT', 'MENU_CATEGORY', 'MENU_PAYMENT', 'MENU_STOCK', 'MENU_STOCK_ADJUSTMENT', 'MENU_SETTING', 'MENU_TRANSACTION_HISTORY', 'MENU_POS');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STAFF');
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'STAFF';
COMMIT;

-- AlterTable
ALTER TABLE "business" ADD COLUMN     "isDiscountEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTaxEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxDiscount" INTEGER,
ADD COLUMN     "taxPercentage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "roleId" TEXT,
ALTER COLUMN "role" SET DEFAULT 'STAFF';

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" "MenuPermission"[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_businessId_idx" ON "role"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "role_businessId_name_key" ON "role"("businessId", "name");

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

