import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Which driver to use, decided from the connection string alone.
 *
 * Deliberately not in src/lib/db.ts: that file is server-only, and the seed and
 * the editor CLI need this too. When each of them chose its own adapter, the
 * app moved to Postgres and the scripts silently did not — which is exactly the
 * failure this file exists to prevent.
 */
export function createAdapter(url: string) {
  return url.startsWith("postgres")
    ? new PrismaPg({ connectionString: url })
    : new PrismaBetterSqlite3({ url });
}

export function databaseUrl(): string {
  return process.env.DATABASE_URL ?? "file:./prisma/dev.db";
}
