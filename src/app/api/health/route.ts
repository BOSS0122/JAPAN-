import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { operatorReady } from "@/config/operator";

export const dynamic = "force-dynamic";

/**
 * Liveness and readiness in one.
 *
 * A health check that only proves the process is running will report green
 * while every page 500s on a dead database, so this one actually touches it.
 * The operator-details flag is reported but never fails the check: an
 * unfinished legal page is a launch problem, not an outage.
 */
export async function GET() {
  const started = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return NextResponse.json(
      { status: "error", database: "unreachable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      status: "ok",
      database: "ok",
      databaseLatencyMs: Date.now() - started,
      operatorDetailsComplete: operatorReady(),
      linkSigningConfigured: Boolean(process.env.LINK_SECRET),
      siteUrlConfigured: Boolean(process.env.SITE_URL),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
