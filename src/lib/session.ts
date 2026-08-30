import "server-only";
import { cookies } from "next/headers";

export const TRAVELLER_COOKIE = "jq_traveller";
export const NAME_COOKIE = "jq_name";

/**
 * Travellers are anonymous. Itineraries are shared by invite link and need no
 * account, so nothing here authenticates anybody — and nothing is allowed to
 * look as if it does.
 *
 * The only thing stored is a display name, so a shared itinerary can say who
 * added a note. It grants nothing, which is why it needs no verification: a
 * name is a label the traveller chose, not a claim the server vouches for.
 */

/** Anonymous per-device id, stamped by the proxy. */
export async function getTravellerId(): Promise<string> {
  const store = await cookies();
  return store.get(TRAVELLER_COOKIE)?.value ?? "anonymous";
}

/** Plain text, never structured: nothing here is parsed, so nothing is injectable. */
export async function getDisplayName(): Promise<string | null> {
  const raw = (await cookies()).get(NAME_COOKIE)?.value;
  return raw ? sanitiseName(raw) : null;
}

export function sanitiseName(raw: string): string | null {
  // Control characters would let a name break the line it is rendered on.
  const cleaned = raw.replace(/[\p{C}]/gu, "").trim().slice(0, 40);
  return cleaned || null;
}
