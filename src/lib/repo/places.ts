import "server-only";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { PLACE_PAGE_SIZE, type PlaceQuery } from "@/lib/place-query";
import { relevanceScore } from "@/lib/season";
import { locales, routing, type Locale } from "@/i18n/routing";
import type {
  CrowdLevel,
  InterestTag,
  LocalizedText,
  Place,
  PlaceCategory,
  Season,
  Weather,
} from "@/data/types";

/**
 * Reads places out of the database and hands back the same `Place` shape the
 * rest of the app already speaks, so nothing downstream had to learn Prisma.
 */

type Row = {
  slug: string;
  category: string;
  areaKey: string;
  prefecture: string;
  famous: boolean;
  lat: number;
  lng: number;
  stayMinutes: number;
  crowd: string;
  indoor: boolean;
  accessible: boolean;
  openHour: number;
  closeHour: number;
  priceFrom: number | null;
  bookable: boolean;
  commissionPct: number;
  externalBookingUrl: string | null;
  mealSlot: string | null;
  imageEmoji: string;
  imageFrom: string;
  imageTo: string;
  seasonSpring: number;
  seasonSummer: number;
  seasonAutumn: number;
  seasonWinter: number;
  translations: { locale: string; name: string; description: string; area: string }[];
  tags: { tag: string }[];
  photos: {
    id: string;
    url: string;
    alt: string;
    credit: string;
    creditUrl: string | null;
  }[];
};

const INCLUDE = {
  translations: true,
  tags: true,
  photos: { orderBy: { position: "asc" } },
} as const;

/** A missing translation falls back to the default locale rather than blank. */
function localized(
  rows: Row["translations"],
  field: "name" | "description" | "area",
): LocalizedText {
  const byLocale = new Map(rows.map((r) => [r.locale, r]));
  const fallback = byLocale.get(routing.defaultLocale) ?? rows[0];
  return Object.fromEntries(
    locales.map((locale) => [locale, (byLocale.get(locale) ?? fallback)?.[field] ?? ""]),
  ) as Record<Locale, string>;
}

function toPlace(row: Row): Place {
  return {
    id: row.slug,
    category: row.category as PlaceCategory,
    name: localized(row.translations, "name"),
    description: localized(row.translations, "description"),
    area: localized(row.translations, "area"),
    areaKey: row.areaKey,
    prefecture: row.prefecture,
    famous: row.famous,
    tags: row.tags.map((t) => t.tag as InterestTag),
    lat: row.lat,
    lng: row.lng,
    stayMinutes: row.stayMinutes,
    crowd: row.crowd as CrowdLevel,
    seasonScore: {
      spring: row.seasonSpring,
      summer: row.seasonSummer,
      autumn: row.seasonAutumn,
      winter: row.seasonWinter,
    },
    indoor: row.indoor,
    accessible: row.accessible,
    image: { emoji: row.imageEmoji, from: row.imageFrom, to: row.imageTo },
    photos: row.photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      alt: photo.alt,
      credit: photo.credit,
      creditUrl: photo.creditUrl ?? undefined,
    })),
    priceFrom: row.priceFrom ?? undefined,
    bookable: row.bookable,
    commissionPct: row.commissionPct,
    externalBookingUrl: row.externalBookingUrl ?? undefined,
    openHour: row.openHour,
    closeHour: row.closeHour,
    mealSlot: (row.mealSlot as Place["mealSlot"]) ?? undefined,
  };
}

/** Published places only. Drafts stay invisible to travellers. */
export async function listPlaces(): Promise<Place[]> {
  const rows = await prisma.place.findMany({
    where: { status: "published" },
    include: INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toPlace);
}

export async function getPlaceBySlug(slug: string): Promise<Place | null> {
  const row = await prisma.place.findFirst({
    where: { slug, status: "published" },
    include: INCLUDE,
  });
  return row ? toPlace(row) : null;
}

/** Used where only the shortlisted subset is needed — never the whole catalogue. */
export async function listPlacesBySlugs(slugs: string[]): Promise<Place[]> {
  if (slugs.length === 0) return [];
  const rows = await prisma.place.findMany({
    where: { slug: { in: slugs }, status: "published" },
    include: INCLUDE,
  });
  const bySlug = new Map(rows.map((r) => [r.slug, toPlace(r)]));
  // Preserve the caller's order — the shortlist order is meaningful.
  return slugs.map((slug) => bySlug.get(slug)).filter((p): p is Place => Boolean(p));
}

/** Slim rows for pickers, so a page never ships the whole catalogue to render a dropdown. */
export async function listPlaceOptions(
  locale: string,
): Promise<{ slug: string; name: string; area: string }[]> {
  const rows = await prisma.place.findMany({
    where: { status: "published" },
    select: {
      slug: true,
      translations: { select: { locale: true, name: true, area: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => {
    const t =
      row.translations.find((x) => x.locale === locale) ??
      row.translations.find((x) => x.locale === routing.defaultLocale) ??
      row.translations[0];
    return { slug: row.slug, name: t?.name ?? row.slug, area: t?.area ?? "" };
  });
}

/** Every place including drafts — the editor console only. */
export async function listPlacesForAdmin() {
  return prisma.place.findMany({
    include: INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPlaceForAdmin(slug: string) {
  return prisma.place.findUnique({ where: { slug }, include: INCLUDE });
}

// ---------------------------------------------------------------- searching
// Explore used to ship the whole catalogue to the browser and filter it in a
// `useMemo`. That is correct up to a few hundred places and collapses well
// before a few thousand. Everything below narrows in SQL and returns one page.

/** Interest tags are AND-ed: picking two means "has both", not "has either". */
function buildWhere(query: PlaceQuery, tagMatches: InterestTag[]) {
  const AND: Prisma.PlaceWhereInput[] = [{ status: "published" }];

  if (query.category !== "all") AND.push({ category: query.category });
  if (query.area !== "all") AND.push({ areaKey: query.area });
  if (query.fame !== "any") AND.push({ famous: query.fame === "famous" });
  for (const tag of query.tags) AND.push({ tags: { some: { tag } } });

  if (query.q) {
    const contains = query.q;
    // Deliberately not restricted to the reading locale: someone browsing in
    // Thai still types "Kyoto", and a name in any language should find it.
    AND.push({
      OR: [
        { prefecture: { contains } },
        {
          translations: {
            some: {
              OR: [
                { name: { contains } },
                { description: { contains } },
                { area: { contains } },
              ],
            },
          },
        },
        ...(tagMatches.length > 0 ? [{ tags: { some: { tag: { in: tagMatches } } } }] : []),
      ],
    });
  }

  return { AND };
}

export interface PlaceSearchResult {
  places: Place[];
  total: number;
  page: number;
  pageCount: number;
}

/**
 * @param tagMatches interest tags whose translated label matches the free-text
 *   query. Resolved by the caller, which is the layer that holds the messages —
 *   this module stays free of i18n.
 */
export async function searchPlaces(
  query: PlaceQuery,
  context: { season: Season; weather: Weather; tagMatches?: InterestTag[] },
): Promise<PlaceSearchResult> {
  const where = buildWhere(query, context.tagMatches ?? []);

  // A page past the end is clamped rather than shown empty: narrowing a filter
  // while on page 3 is the common way to land there, and "no results" would be
  // a lie about a result set that does have matches.
  const pages = (total: number) => Math.max(1, Math.ceil(total / PLACE_PAGE_SIZE));

  if (query.sort === "recommended") {
    // Relevance is a season- and weather-dependent function, so it cannot be an
    // ORDER BY. Ranking reads six integer columns and no joins; hydration then
    // touches only the 24 rows actually shown. Past six figures of places this
    // wants a stored rank column refreshed on a schedule.
    const ranked = await prisma.place.findMany({
      where,
      select: {
        slug: true,
        indoor: true,
        crowd: true,
        famous: true,
        seasonSpring: true,
        seasonSummer: true,
        seasonAutumn: true,
        seasonWinter: true,
      },
    });

    const pageCount = pages(ranked.length);
    const page = Math.min(query.page, pageCount);
    const skip = (page - 1) * PLACE_PAGE_SIZE;

    const slugs = ranked
      .map((row) => ({
        slug: row.slug,
        score: relevanceScore(
          {
            indoor: row.indoor,
            crowd: row.crowd as CrowdLevel,
            famous: row.famous,
            seasonScore: {
              spring: row.seasonSpring,
              summer: row.seasonSummer,
              autumn: row.seasonAutumn,
              winter: row.seasonWinter,
            },
          },
          context.season,
          context.weather,
        ),
      }))
      // Slug breaks ties so paging never shows the same place twice.
      .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))
      .slice(skip, skip + PLACE_PAGE_SIZE)
      .map((row) => row.slug);

    return { places: await listPlacesBySlugs(slugs), total: ranked.length, page, pageCount };
  }

  const orderBy: Prisma.PlaceOrderByWithRelationInput[] =
    query.sort === "duration"
      ? [{ stayMinutes: "asc" }, { slug: "asc" }]
      : [{ priceFrom: "asc" }, { slug: "asc" }];

  // Counted first so the page can be clamped before the rows are fetched.
  const total = await prisma.place.count({ where });
  const pageCount = pages(total);
  const page = Math.min(query.page, pageCount);

  const rows = await prisma.place.findMany({
    where,
    include: INCLUDE,
    orderBy,
    skip: (page - 1) * PLACE_PAGE_SIZE,
    take: PLACE_PAGE_SIZE,
  });

  return { places: rows.map(toPlace), total, page, pageCount };
}

/** How many places a traveller could reach at all — the unfiltered headline. */
export function countPlaces(): Promise<number> {
  return prisma.place.count({ where: { status: "published" } });
}

/**
 * Areas for the dropdown, from the whole catalogue rather than the current
 * page. One grouped query plus one small lookup per area; worth caching once
 * the list outgrows a dropdown.
 */
export async function listAreaOptions(
  locale: string,
): Promise<{ key: string; label: string; count: number }[]> {
  const groups = await prisma.place.groupBy({
    by: ["areaKey"],
    where: { status: "published" },
    _count: { _all: true },
  });

  const options = await Promise.all(
    groups.map(async (group) => {
      const rep = await prisma.place.findFirst({
        where: { areaKey: group.areaKey, status: "published" },
        select: {
          translations: {
            where: { locale: { in: [locale, routing.defaultLocale] } },
            select: { locale: true, area: true },
          },
        },
      });
      const translations = rep?.translations ?? [];
      const label =
        translations.find((t) => t.locale === locale)?.area ??
        translations[0]?.area ??
        group.areaKey;
      return { key: group.areaKey, label, count: group._count._all };
    }),
  );

  return options.sort((a, b) => a.label.localeCompare(b.label));
}
