import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { EDITOR_COOKIE } from "@/lib/auth/editor";
import { isLaunched } from "@/config/launch";

/**
 * Who may see the traveller site before launch.
 *
 * Checked in a layout rather than the proxy: the proxy runs on the edge with no
 * database, and "is this a live editor session" is a database question. Doing it
 * with an unsigned cookie instead would mean the holding page could be walked
 * past by anyone who guessed a cookie name.
 */
export async function mayViewSite(): Promise<boolean> {
  if (isLaunched()) return true;

  const token = (await cookies()).get(EDITOR_COOKIE)?.value;
  if (!token) return false;

  const session = await prisma.editorSession.findUnique({
    where: { tokenHash: createHash("sha256").update(token).digest("hex") },
    include: { editor: { select: { status: true } } },
  });

  return Boolean(session && session.expiresAt > new Date() && session.editor.status === "active");
}

export class NotLaunched extends Error {
  constructor() {
    super("This service is not open yet.");
    this.name = "NotLaunched";
  }
}

/**
 * Refuses public writes before launch.
 *
 * Hiding the interface is not closing the door: server actions have stable ids
 * and are callable directly, so a booking could be created against a shop that
 * has not opened. Read paths are left alone — an editor previewing the site
 * needs them, and reading is what the holding page already prevents in
 * practice.
 */
export async function assertSiteOpen(): Promise<void> {
  if (!(await mayViewSite())) throw new NotLaunched();
}
