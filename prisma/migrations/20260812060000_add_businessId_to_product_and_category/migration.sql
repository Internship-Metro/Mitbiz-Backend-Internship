-- Migration: replace outletId with businessId in category and product tables
-- Mengganti kolom outletId menjadi businessId di tabel category dan product

-- ============================================================
-- CATEGORY TABLE
-- ============================================================

-- Hapus constraint dan index lama (outletId)
ALTER TABLE "category" DROP CONSTRAINT IF EXISTS "category_outletId_fkey";
DROP INDEX IF EXISTS "category_outletId_idx";
DROP INDEX IF EXISTS "category_outletId_name_key";

-- Hapus kolom lama
ALTER TABLE "category" DROP COLUMN IF EXISTS "outletId";

-- Tambah kolom baru
ALTER TABLE "category" ADD COLUMN "businessId" TEXT NOT NULL DEFAULT '';

-- Hapus default setelah kolom dibuat
ALTER TABLE "category" ALTER COLUMN "businessId" DROP DEFAULT;

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
ALTER TABLE "product" ADD COLUMN "businessId" TEXT NOT NULL DEFAULT '';

-- Hapus default setelah kolom dibuat
ALTER TABLE "product" ALTER COLUMN "businessId" DROP DEFAULT;

-- Tambah index dan constraint baru
CREATE INDEX "product_businessId_idx" ON "product"("businessId");
CREATE UNIQUE INDEX "product_businessId_sku_key" ON "product"("businessId", "sku");
CREATE INDEX "product_categoryId_idx" ON "product"("categoryId");
ALTER TABLE "product" ADD CONSTRAINT "product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product" ADD CONSTRAINT "product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
