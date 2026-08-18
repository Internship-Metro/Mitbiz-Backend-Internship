-- Fase 1: Hapus field diskon global dari tabel business, field cash dari tabel shift,
-- dan field discountAmount dari tabel transaction.
-- Keputusan: diskon hanya ada di level produk, shift tidak melacak uang kas fisik.

-- AlterTable: Hapus 4 field diskon global dari bisnis
ALTER TABLE "business" DROP COLUMN "discountProductIds",
DROP COLUMN "isDiscountEnabled",
DROP COLUMN "maxDiscount",
DROP COLUMN "maxDiscountNominal";

-- AlterTable: Hapus openingCash & closingCash dari shift
ALTER TABLE "shift" DROP COLUMN "closingCash",
DROP COLUMN "openingCash";

-- AlterTable: Hapus discountAmount dari transaksi
ALTER TABLE "transaction" DROP COLUMN "discountAmount";
