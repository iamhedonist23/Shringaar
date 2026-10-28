CREATE TYPE "ShipmentStatus" AS ENUM (
    'PENDING',
    'PACKING',
    'READY_TO_SHIP',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'EXCEPTION',
    'RETURNED',
    'CANCELLED'
);

ALTER TABLE "Order"
ADD COLUMN "shipmentStatus" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "trackingNumber" TEXT,
ADD COLUMN "carrierName" TEXT;

CREATE INDEX "Order_shipmentStatus_updatedAt_idx"
ON "Order"("shipmentStatus", "updatedAt");
