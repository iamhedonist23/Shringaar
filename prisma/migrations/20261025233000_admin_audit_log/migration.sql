CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditLog_entityType_entityId_createdAt_idx"
ON "AdminAuditLog"("entityType", "entityId", "createdAt");

CREATE INDEX "AdminAuditLog_actorId_createdAt_idx"
ON "AdminAuditLog"("actorId", "createdAt");

ALTER TABLE "AdminAuditLog"
ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
