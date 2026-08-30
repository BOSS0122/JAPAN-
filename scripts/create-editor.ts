/**
 * Bootstraps the first editor account, and adds later ones from the shell.
 *
 *   npm run editor:create -- you@example.com "Your Name" admin
 *
 * Re-running for an existing address resets that account's password and role,
 * which is the way back in when the last admin is locked out.
 */
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword, passwordProblem } from "../src/lib/auth/password";
import { randomBytes } from "node:crypto";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // No .env is fine; DATABASE_URL may come from the environment.
}

const [email, name, roleArg, passwordArg] = process.argv.slice(2);

if (!email || !name) {
  console.error('Usage: npm run editor:create -- <email> "<name>" [admin|editor] [password]');
  process.exit(1);
}

const role = roleArg === "admin" ? "admin" : "editor";
// A generated password is never reused and never sits in shell history.
const password = passwordArg ?? randomBytes(9).toString("base64url");

const problem = passwordProblem(password);
if (problem) {
  console.error(problem);
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
});

async function main() {
  const passwordHash = hashPassword(password);
  const editor = await prisma.editor.upsert({
    where: { email: email.toLowerCase() },
    update: { name, role, passwordHash, status: "active" },
    create: { email: email.toLowerCase(), name, role, passwordHash },
  });

  console.log(`\n  ${editor.email}  (${editor.role})`);
  if (!passwordArg) console.log(`  password: ${password}`);
  console.log(`\n  Sign in at /admin/login. Change the password from /admin/account.\n`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
