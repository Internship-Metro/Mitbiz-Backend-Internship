-- Migration: add_username_to_user
-- Dibuat manual karena schema sudah di-push via prisma db push

-- AlterTable: buat email nullable
ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable: tambah kolom username
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "username" TEXT;

-- CreateIndex: unique constraint untuk username
CREATE UNIQUE INDEX IF NOT EXISTS "user_username_key" ON "user"("username");
