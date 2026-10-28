CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'PAYTM', 'UNSPECIFIED');

ALTER TABLE "Order"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "requestHash" TEXT,
ADD COLUMN "paymentMethod" "PaymentMethod";

UPDATE "Order"
SET
    "idempotencyKey" = 'legacy-' || "id",
    "requestHash" = 'legacy-' || "id",
    "paymentMethod" = 'UNSPECIFIED'
WHERE "idempotencyKey" IS NULL
   OR "requestHash" IS NULL
   OR "paymentMethod" IS NULL;

ALTER TABLE "Order"
ALTER COLUMN "idempotencyKey" SET NOT NULL,
ALTER COLUMN "requestHash" SET NOT NULL,
ALTER COLUMN "paymentMethod" SET NOT NULL;

CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_gatewayOrderId_key" ON "Payment"("gatewayOrderId");
CREATE UNIQUE INDEX "Payment_gatewayPaymentId_key" ON "Payment"("gatewayPaymentId");
CREATE INDEX "Payment_orderId_status_idx" ON "Payment"("orderId", "status");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
