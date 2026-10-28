ALTER TYPE "PaymentMethod" ADD VALUE 'UROPAY';

ALTER TABLE "Payment"
ADD COLUMN "gatewayCheckoutUrl" TEXT,
ADD COLUMN "statusTokenHash" TEXT;

ALTER TABLE "Order"
ADD COLUMN "inventoryReserved" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE UNIQUE INDEX "Payment_statusTokenHash_key"
ON "Payment"("statusTokenHash");
