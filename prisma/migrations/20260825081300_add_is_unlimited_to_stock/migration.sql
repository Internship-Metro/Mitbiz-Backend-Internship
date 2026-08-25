-- AlterTable: Tambah kolom isUnlimited pada tabel stock
ALTER TABLE "stock" ADD COLUMN "isUnlimited" BOOLEAN NOT NULL DEFAULT false;
