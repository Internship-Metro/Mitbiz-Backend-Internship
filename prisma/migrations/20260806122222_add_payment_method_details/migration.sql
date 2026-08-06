-- AlterEnum
ALTER TYPE "MenuPermission" ADD VALUE 'MENU_SHIFT';

-- AlterTable
ALTER TABLE "payment_method" ADD COLUMN     "details" TEXT;
