import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { getMoodProvider } from "@/lib/providers";
import type { MoodCandidate } from "@/lib/providers/types";
import type { Place } from "@/data/types";
import { t as localized } from "@/lib/localized";

/**
 * Mood search, grounded.
 *
 * Three things happen in order, and the order is the point:
 *   1. The database decides which places are even eligible.
 *   2. A provider ranks and explains only those.
 *   3. Everything it returns is checked back against step 1.
 *
 * A model cannot put a place in front of a traveller that the catalogue does
 * not contain, because the only ids that survive step 3 are ids that came out
 * of step 1. An id we did not supply is dropped and counted — that count is the
 * canary for a provider drifting off its instructions.
 */

/** How many places the provider is allowed to see. Beyond this, prefilter first. */
const MAX_CANDIDATES = 400;

/**
 * Bump when the ranking changes — the prompt, the scoring, the fields a
 * provider is shown. Without it, deploying a better answer keeps serving the
 * worse one until every cached entry expires.
 */
const ALGO_VERSION = 2;

export interface MoodResult {
  places: Place[];
  /** slug → the one-line reason, when the provider gave one. */
  reasons: Map<string, string>;
  /** False when the offline fallback answered, so the page can say so. */
  semantic: boolean;
  /** Non-zero means a provider returned something that is not in the catalogue. */
  rejected: number;
  cached: boolean;
}

function toCandidate(place: Place, locale: string): MoodCandidate {
  return {
    id: place.id,
    name: localized(place.name, locale),
    area: localized(place.area, locale),
    prefecture: place.prefecture,
    category: place.category,
    tags: place.tags,
    description: localized(place.description, locale),
    openHour: place.openHour,
    closeHour: place.closeHour,
    priceFrom: place.priceFrom,
    indoor: place.indoor,
    famous: place.famous,
    crowd: place.crowd,
  };
}

/**
 * Cache key covers everything that changes the answer, including which places
 * were eligible — so publishing a new place does not serve a stale result that
 * could never have contained it.
 */
function cacheKey(text: string, locale: string, candidates: MoodCandidate[]): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        v: ALGO_VERSION,
        q: text.trim().toLowerCase(),
        locale,
        provider: process.env.MOOD_PROVIDER ?? "local",
        ids: candidates.map((c) => c.id).sort(),
      }),
    )
    .digest("hex");
}

const CACHE_HOURS = 24;

export async function moodSearch(
  text: string,
  locale: string,
  pool: Place[],
  limit = 12,
): Promise<MoodResult> {
  const trimmed = text.trim().slice(0, 200);
  const empty: MoodResult = {
    places: [],
    reasons: new Map(),
    semantic: false,
    rejected: 0,
    cached: false,
  };
  if (!trimmed || pool.length === 0) return empty;

  const candidates = pool.slice(0, MAX_CANDIDATES).map((p) => toCandidate(p, locale));
  const bySlug = new Map(pool.map((p) => [p.id, p]));
  const key = cacheKey(trimmed, locale, candidates);
  const provider = await getMoodProvider();

  const hit = await prisma.moodSearchCache
    .findUnique({ where: { key } })
    .catch(() => null);
  if (hit && hit.expiresAt > new Date()) {
    return {
      ...hydrate(JSON.parse(hit.matches), bySlug),
      semantic: hit.semantic,
      cached: true,
    };
  }

  let matches;
  try {
    matches = await provider.search({ text: trimmed, locale, candidates, limit });
  } catch (error) {
    // A failed search should be an empty result, not a 500 on the page the
    // traveller is reading.
    console.error("[mood] provider failed", error instanceof Error ? error.message : error);
    return empty;
  }

  const result = hydrate(matches, bySlug);

  await prisma.moodSearchCache
    .upsert({
      where: { key },
      create: {
        key,
        query: trimmed,
        locale,
        semantic: provider.semantic,
        matches: JSON.stringify(matches),
        expiresAt: new Date(Date.now() + CACHE_HOURS * 3600_000),
      },
      update: {
        matches: JSON.stringify(matches),
        semantic: provider.semantic,
        expiresAt: new Date(Date.now() + CACHE_HOURS * 3600_000),
      },
    })
    .catch(() => {
      // Caching is an optimisation; losing it must not lose the answer.
    });

  return { ...result, semantic: provider.semantic, cached: false };
}

/**
 * The grounding step. Anything not in the candidate map never leaves here.
 * Exported so it can be tested directly: this is the function standing between
 * a model's output and a traveller's itinerary.
 */
export function hydrate(
  matches: { id: string; reason: string }[],
  bySlug: Map<string, Place>,
): Omit<MoodResult, "semantic" | "cached"> {
  const places: Place[] = [];
  const reasons = new Map<string, string>();
  const seen = new Set<string>();
  let rejected = 0;

  for (const match of matches) {
    const place = bySlug.get(match.id);
    if (!place) {
      rejected += 1;
      console.warn(`[mood] provider returned an id not in the catalogue: ${match.id}`);
      continue;
    }
    if (seen.has(place.id)) continue;
    seen.add(place.id);
    places.push(place);
    if (match.reason?.trim()) reasons.set(place.id, match.reason.trim());
  }

  return { places, reasons, rejected };
}

/** Removes expired rows. Called opportunistically, never on the read path. */
export async function pruneMoodCache(): Promise<void> {
  await prisma.moodSearchCache
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => {});
}

export const moodLocales = routing.locales;
