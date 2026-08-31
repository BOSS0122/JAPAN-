import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed partner hand-off links.
 *
 * Affiliate revenue is only collectable if we can show what we sent. Every
 * outbound link therefore goes through /api/go, which records the click and
 * then redirects.
 *
 * A redirect that forwards to any URL in a query string is an open redirect —
 * a phishing primitive that would sit on our domain and our reputation. So the
 * destination is signed with a server secret and checked against a host
 * allowlist: /api/go follows only URLs this server built.
 */

/**
 * Hosts we are willing to send a traveller to. One line per signed deal; an
 * unlisted host is never redirected to, however the link was produced.
 */
const ALLOWED_HOSTS = [
  // The mock providers. A reserved TLD, so it cannot be registered by anyone.
  "example-partner.invalid",
];

/**
 * LINK_SECRET is required in production and the app refuses to start without
 * it. A missing signing key is a deployment mistake, and the two ways to
 * "handle" it are both worse than stopping: signing with a constant from the
 * source turns this into an open redirect anyone can forge, and inventing one
 * per process silently breaks every affiliate link — which is the revenue this
 * whole path exists to capture.
 *
 * Note it must be a constant, not a per-process value: the page that signs a
 * link and the route that verifies it are separate server bundles.
 */
function resolveSecret(): string {
  const configured = process.env.LINK_SECRET;
  if (configured && configured.length >= 16) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "LINK_SECRET must be set to at least 16 characters. Partner redirects are signed with it.",
    );
  }
  return "development-only-link-secret-do-not-use-in-production";
}

const SECRET = resolveSecret();

const sign = (payload: string) =>
  createHmac("sha256", SECRET).update(payload).digest("base64url");

export interface PartnerTarget {
  url: string;
  partnerId: string;
  partnerName: string;
  /** flight | hotel | place-booking | support | shop */
  surface: string;
  /** Offer id or place slug. */
  ref: string;
  placeSlug?: string;
  /** What this click is worth if it converts, at the partner's stated rate. */
  estimatedValueJpy?: number;
}

/** Exposed so the preflight check can tell a real deal from the mock. */
export function allowedPartnerHosts(): readonly string[] {
  return ALLOWED_HOSTS;
}

export function isAllowedPartnerHost(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    // http would hand the traveller's referrer to anyone on the path. The mock
    // host is exempt because it deliberately does not resolve at all.
    if (url.protocol !== "https:" && url.hostname !== "example-partner.invalid") return false;
    return ALLOWED_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

/** Returns the tracked URL, or the bare destination if it cannot be signed. */
export function partnerHref(target: PartnerTarget): string {
  if (!isAllowedPartnerHost(target.url)) {
    // An unknown host is a configuration mistake, not a reason to strand the
    // traveller — but it is also not something we will sign.
    return target.url;
  }

  const payload = JSON.stringify({
    u: target.url,
    p: target.partnerId,
    n: target.partnerName,
    s: target.surface,
    r: target.ref,
    l: target.placeSlug ?? "",
    v: target.estimatedValueJpy ?? 0,
  });
  const data = Buffer.from(payload).toString("base64url");
  return `/api/go?d=${data}&s=${sign(data)}`;
}

export function verifyPartnerLink(data: string, signature: string): PartnerTarget | null {
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const raw = JSON.parse(Buffer.from(data, "base64url").toString());
    // Re-checked after verification: the allowlist may have shrunk since the
    // link was signed, and the shorter list is the one that counts.
    if (!isAllowedPartnerHost(raw.u)) return null;
    return {
      url: raw.u,
      partnerId: String(raw.p),
      partnerName: String(raw.n),
      surface: String(raw.s),
      ref: String(raw.r),
      placeSlug: raw.l || undefined,
      estimatedValueJpy: Number(raw.v) || 0,
    };
  } catch {
    return null;
  }
}
