import { PrismaClient } from "@/generated/prisma";
import { createAdapter, databaseUrl } from "./db-adapter";

/**
 * One client per process. Next.js hot-reloads modules in dev, so without the
 * global cache every save would open another pool.
 *
 * The adapter is chosen from the URL scheme, so moving to Postgres is changing
 * DATABASE_URL and the datasource provider in the schema — no code edit. Both
 * paths are exercised, not just the one development happens to use.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  return new PrismaClient({ adapter: createAdapter(databaseUrl()) });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
