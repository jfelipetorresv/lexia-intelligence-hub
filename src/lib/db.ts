import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// In dev, always create a fresh client to avoid stale globalThis cache
// after `prisma generate`. Connection pooling is handled by pg Pool.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = createPrismaClient();
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV === "production" && !globalForPrisma.prisma) {
  globalForPrisma.prisma = db;
}
