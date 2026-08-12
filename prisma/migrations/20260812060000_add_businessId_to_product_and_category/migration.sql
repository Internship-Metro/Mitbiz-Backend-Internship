-- Migration: replace outletId with businessId in category and product tables
-- Mengganti kolom outletId menjadi businessId di tabel category dan product
-- Data lama dihapus dulu karena tidak bisa diisi businessId yang valid secara otomatis

-- ============================================================
-- Hapus data turunan dulu (karena FK ke product/category)
-- ============================================================
DELETE FROM "transaction_item";
DELETE FROM "transaction";
DELETE FROM "stock_adjustment";
DELETE FROM "stock";

-- ============================================================
-- CATEGORY TABLE
-- ============================================================

-- Hapus constraint dan index lama (outletId)
ALTER TABLE "category" DROP CONSTRAINT IF EXISTS "category_outletId_fkey";
DROP INDEX IF EXISTS "category_outletId_idx";
DROP INDEX IF EXISTS "category_outletId_name_key";

-- Hapus kolom lama
ALTER TABLE "category" DROP COLUMN IF EXISTS "outletId";

-- Hapus semua data kategori lama (tidak bisa diisi businessId)
DELETE FROM "product";
DELETE FROM "category";

-- Tambah kolom baru (nullable dulu, baru jadikan NOT NULL setelah constraint siap)
ALTER TABLE "category" ADD COLUMN "businessId" TEXT;

-- Jadikan NOT NULL
ALTER TABLE "category" ALTER COLUMN "businessId" SET NOT NULL;

-- Tambah index dan constraint baru
CREATE INDEX "category_businessId_idx" ON "category"("businessId");
CREATE UNIQUE INDEX "category_businessId_name_key" ON "category"("businessId", "name");
ALTER TABLE "category" ADD CONSTRAINT "category_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- PRODUCT TABLE
-- ============================================================

-- Hapus constraint dan index lama (outletId)
ALTER TABLE "product" DROP CONSTRAINT IF EXISTS "product_outletId_fkey";
ALTER TABLE "product" DROP CONSTRAINT IF EXISTS "product_categoryId_fkey";
DROP INDEX IF EXISTS "product_outletId_idx";
DROP INDEX IF EXISTS "product_outletId_sku_key";
DROP INDEX IF EXISTS "product_categoryId_idx";

-- Hapus kolom lama
ALTER TABLE "product" DROP COLUMN IF EXISTS "outletId";

-- Tambah kolom baru
ALTER TABLE "product" ADD COLUMN "businessId" TEXT;

-- Jadikan NOT NULL
ALTER TABLE "product" ALTER COLUMN "businessId" SET NOT NULL;

-- Tambah index dan constraint baru
CREATE INDEX "product_businessId_idx" ON "product"("businessId");
CREATE UNIQUE INDEX "product_businessId_sku_key" ON "product"("businessId", "sku");
CREATE INDEX "product_categoryId_idx" ON "product"("categoryId");
ALTER TABLE "product" ADD CONSTRAINT "product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product" ADD CONSTRAINT "product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
