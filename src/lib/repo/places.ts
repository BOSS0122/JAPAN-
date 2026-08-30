import "server-only";
import { prisma } from "@/lib/db";
import { locales, routing, type Locale } from "@/i18n/routing";
import type {
  CrowdLevel,
  InterestTag,
  LocalizedText,
  Place,
  PlaceCategory,
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
};

const INCLUDE = { translations: true, tags: true } as const;

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
    priceFrom: row.priceFrom ?? undefined,
    bookable: row.bookable,
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
