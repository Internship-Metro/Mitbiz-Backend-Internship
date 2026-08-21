-- Restore payment method to original 2-table structure (master + pivot)
-- This reverts the flat model migration (20260821065953_simplify_payment_method_flat)

-- Step 1: Recreate payment_method master table
CREATE TABLE "payment_method" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "PaymentMethodType" NOT NULL DEFAULT 'CASH',
  "details" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_method_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_method_businessId_name_key" ON "payment_method"("businessId", "name");
CREATE INDEX "payment_method_businessId_idx" ON "payment_method"("businessId");

ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 2: Restore outlet_payment_method pivot structure
-- Drop flat model columns
ALTER TABLE "outlet_payment_method"
  DROP COLUMN IF EXISTS "name",
  DROP COLUMN IF EXISTS "type",
  DROP COLUMN IF EXISTS "details";

-- Drop flat model unique index
DROP INDEX IF EXISTS "outlet_payment_method_outletId_name_key";

-- Add paymentMethodId back (table is empty so NOT NULL is safe)
ALTER TABLE "outlet_payment_method" ADD COLUMN "paymentMethodId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "outlet_payment_method" ALTER COLUMN "paymentMethodId" DROP DEFAULT;

-- Restore old unique index and FK
CREATE UNIQUE INDEX "outlet_payment_method_outletId_paymentMethodId_key"
  ON "outlet_payment_method"("outletId", "paymentMethodId");

ALTER TABLE "outlet_payment_method" ADD CONSTRAINT "outlet_payment_method_paymentMethodId_fkey"
  FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 3: Fix transaction.paymentMethodId FK back to payment_method
ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "transaction_paymentMethodId_fkey";

ALTER TABLE "transaction" ADD CONSTRAINT "transaction_paymentMethodId_fkey"
  FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;
