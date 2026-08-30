import "server-only";
import { cookies } from "next/headers";

export const TRAVELLER_COOKIE = "jq_traveller";
export const USER_COOKIE = "jq_user";

/** Anonymous per-device id, stamped by middleware. */
export async function getTravellerId(): Promise<string> {
  const store = await cookies();
  return store.get(TRAVELLER_COOKIE)?.value ?? "anonymous";
}

export interface DemoUser {
  email: string;
  name: string;
}

/**
 * Placeholder auth: the cookie *is* the session. Good enough to demo
 * "who edited the itinerary"; replace before anything real ships.
 */
export async function getUser(): Promise<DemoUser | null> {
  const store = await cookies();
  const raw = store.get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as DemoUser;
  } catch {
    return null;
  }
}

export function encodeUser(user: DemoUser): string {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}
