import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

/**
 * Editor sessions.
 *
 * The cookie carries a random token; the database stores only its SHA-256, so
 * a leaked table hands over no logins. Every request resolves the session
 * against the account, which is what makes disabling someone take effect at
 * once rather than whenever their cookie happens to expire.
 */

export const EDITOR_COOKIE = "jq_editor";
const SESSION_DAYS = 7;

export type EditorRole = "admin" | "editor";

export interface SignedInEditor {
  id: string;
  email: string;
  name: string;
  role: EditorRole;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(editorId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.editorSession.create({
    data: { tokenHash: hashToken(token), editorId, expiresAt },
  });

  (await cookies()).set(EDITOR_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(EDITOR_COOKIE)?.value;
  if (token) {
    await prisma.editorSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(EDITOR_COOKIE);
}

/** Ends every session an account holds — used when disabling or demoting one. */
export async function revokeSessionsFor(editorId: string): Promise<void> {
  await prisma.editorSession.deleteMany({ where: { editorId } });
}

export async function currentEditor(): Promise<SignedInEditor | null> {
  const token = (await cookies()).get(EDITOR_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.editorSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { editor: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (session.editor.status !== "active") return null;

  return {
    id: session.editor.id,
    email: session.editor.email,
    name: session.editor.name,
    role: session.editor.role === "admin" ? "admin" : "editor",
  };
}

/** Page guard: sends anyone without a session to the login screen. */
export async function requireEditor(): Promise<SignedInEditor> {
  const editor = await currentEditor();
  if (!editor) redirect("/admin/login");
  return editor;
}

export async function requireAdmin(): Promise<SignedInEditor> {
  const editor = await requireEditor();
  if (editor.role !== "admin") redirect("/admin/places?denied=1");
  return editor;
}

/**
 * Action guard. Throws rather than redirects, because a server action that
 * silently returned would look to the caller like the write succeeded.
 */
export async function assertEditor(role: EditorRole = "editor"): Promise<SignedInEditor> {
  const editor = await currentEditor();
  if (!editor) throw new Error("Not signed in");
  if (role === "admin" && editor.role !== "admin") throw new Error("Admins only");
  return editor;
}

/** Whether any account exists at all — drives the first-run message. */
export function countEditors(): Promise<number> {
  return prisma.editor.count();
}
