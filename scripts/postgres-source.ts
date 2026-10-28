import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getPostgresSchema } from "@/scripts/postgres-schema";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getPrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = process.env.SOURCE_DATABASE_URL;
  if (!connectionString) {
    throw new Error("SOURCE_DATABASE_URL is required to connect to the legacy PostgreSQL database.");
  }

  const adapter = new PrismaPg(
    { connectionString, max: 1 },
    { schema: getPostgresSchema(connectionString) },
  );
  const prisma = new PrismaClient({ adapter });
  globalForPrisma.prisma = prisma;
  return prisma;
}
