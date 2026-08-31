import "server-only";
import { cookies } from "next/headers";

/**
 * Measurement consent.
 *
 * A banner that changes nothing when you decline is theatre, so this one draws
 * a real line. Two things are genuinely different:
 *
 * - Granted: a partner hand-off records which device made it, so a funnel can
 *   be read per traveller.
 * - Declined: the same hand-off is still counted, because a referral we cannot
 *   evidence is a referral we cannot invoice — but it is stored with no device
 *   id, so it is a tally rather than a record about a person. Place view counts
 *   are aggregate either way and never carried a device id at all.
 *
 * The device cookie itself is not optional: shortlists, bookings and stamps
 * are the service, and it is what makes them yours. That is strictly necessary
 * in the ePrivacy sense, and it is stated rather than bundled into "accept".
 */

export const CONSENT_COOKIE = "jq_consent";

export type ConsentState = "granted" | "declined" | "unset";

export async function getConsent(): Promise<ConsentState> {
  const raw = (await cookies()).get(CONSENT_COOKIE)?.value;
  return raw === "granted" || raw === "declined" ? raw : "unset";
}

/** Undecided is treated as declined: consent is opt-in, not opt-out. */
export async function mayLinkToDevice(): Promise<boolean> {
  return (await getConsent()) === "granted";
}
