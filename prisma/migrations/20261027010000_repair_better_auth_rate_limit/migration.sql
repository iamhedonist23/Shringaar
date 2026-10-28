-- Repair environments where the customer account migration was recorded as
-- applied without creating Better Auth's database-backed rate-limit table.
CREATE TABLE IF NOT EXISTS "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RateLimit_key_key"
    ON "RateLimit"("key");

CREATE INDEX IF NOT EXISTS "RateLimit_lastRequest_idx"
    ON "RateLimit"("lastRequest");
