-- AlterTable: Ubah quantity menjadi nullable (NULL = unlimited) dan hapus kolom isUnlimited
ALTER TABLE "stock" ALTER COLUMN "quantity" DROP NOT NULL;
ALTER TABLE "stock" DROP COLUMN IF EXISTS "isUnlimited";
