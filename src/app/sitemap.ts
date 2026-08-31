import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { listPlaces } from "@/lib/repo/places";
import { products } from "@/data/commerce";
import { legalDocuments } from "@/data/legal";
import { absoluteUrl } from "@/lib/seo";
import { isLaunched } from "@/config/launch";

/**
 * Generated from the live catalogue, so a place published through the editor
 * console is in the sitemap on the next crawl with no extra step. Every entry
 * carries its language alternates: three translations of one page are
 * competing duplicates until something says they are translations.
 */
export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

function withAlternates(path: string, extra: Partial<Entry> = {}): Entry[] {
  const languages = Object.fromEntries(
    locales.map((code) => [code, absoluteUrl(`/${code}${path}`)]),
  );
  return locales.map((locale) => ({
    url: absoluteUrl(`/${locale}${path}`),
    alternates: { languages },
    ...extra,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // An empty sitemap before launch, rather than a list of pages that answer
  // with a holding page.
  if (!isLaunched()) return [];

  const places = await listPlaces();

  return [
    ...withAlternates("", { changeFrequency: "daily", priority: 1 }),
    ...withAlternates("/explore", { changeFrequency: "daily", priority: 0.9 }),
    ...withAlternates("/plan", { changeFrequency: "monthly", priority: 0.7 }),
    ...withAlternates("/shop", { changeFrequency: "weekly", priority: 0.7 }),
    ...withAlternates("/support", { changeFrequency: "monthly", priority: 0.6 }),
    ...withAlternates("/rewards", { changeFrequency: "monthly", priority: 0.5 }),
    ...withAlternates("/flights", { changeFrequency: "monthly", priority: 0.4 }),
    ...withAlternates("/hotels", { changeFrequency: "monthly", priority: 0.4 }),
    ...places.flatMap((place) =>
      withAlternates(`/places/${place.id}`, {
        changeFrequency: "weekly",
        priority: place.famous ? 0.8 : 0.7,
      }),
    ),
    ...products.flatMap((product) =>
      withAlternates(`/shop/${product.id}`, { changeFrequency: "weekly", priority: 0.6 }),
    ),
    ...legalDocuments.flatMap((doc) =>
      withAlternates(`/legal/${doc.slug}`, { changeFrequency: "yearly", priority: 0.2 }),
    ),
  ];
}
