import "server-only";
import { headers } from "next/headers";

/**
 * Fixed-window rate limiting, held in this process's memory.
 *
 * That is a real constraint, stated rather than hidden: with several instances
 * each keeps its own count, so the effective limit multiplies by the instance
 * count. For one box it is exactly right, and it needs no dependency. Moving to
 * Redis is replacing `hit` — every call site already goes through it.
 *
 * Anonymous writes need this more than most services do: itineraries, notes and
 * bookings all work without an account, so there is no signup step in the way
 * of anyone who wants to fill the database.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
let lastSweep = 0;

/** Expired keys are dropped opportunistically, so the map cannot grow forever. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimit {
  /** Requests permitted per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export const LIMITS = {
  /** Creating itineraries: generous for a real planner, useless for a script. */
  createTrip: { limit: 20, windowSeconds: 3600 },
  /** Notes are the cheapest thing to spam on a link anyone can open. */
  tripNote: { limit: 30, windowSeconds: 3600 },
  tripEdit: { limit: 200, windowSeconds: 3600 },
  booking: { limit: 10, windowSeconds: 3600 },
  order: { limit: 10, windowSeconds: 3600 },
  /** Deliberately tight: this one guards a password. */
  adminLogin: { limit: 8, windowSeconds: 900 },
} as const satisfies Record<string, RateLimit>;

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function hit(bucket: string, identifier: string, rule: RateLimit): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const key = `${bucket}:${identifier}`;
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + rule.windowSeconds * 1000 });
    return { ok: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > rule.limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client address. Behind a proxy this is a forwarded header, which
 * a client can forge unless the proxy overwrites it — so it is used together
 * with the traveller cookie, never alone, and never for authorisation.
 */
export async function clientAddress(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 64);
  return h.get("x-real-ip")?.slice(0, 64) ?? "unknown";
}

export class RateLimited extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many requests. Try again shortly.");
    this.name = "RateLimited";
  }
}

/** Throws rather than returning: a silent no-op would look like success. */
export async function enforce(
  bucket: string,
  rule: RateLimit,
  extraIdentifier?: string,
): Promise<void> {
  const identifier = `${await clientAddress()}|${extraIdentifier ?? ""}`;
  const result = hit(bucket, identifier, rule);
  if (!result.ok) throw new RateLimited(result.retryAfterSeconds);
}
