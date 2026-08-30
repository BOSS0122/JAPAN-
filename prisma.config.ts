import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer reads .env by itself, and keeps the connection URL out of
// the schema so the same schema can point at SQLite locally and Postgres in
// production. Node loads the file natively; in CI the vars are already set.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // no .env in this environment — rely on the real environment variables
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
