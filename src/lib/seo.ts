import { locales, routing } from "@/i18n/routing";
import { operator } from "@/config/operator";

/**
 * Canonical URLs and language alternates.
 *
 * Three languages of the same page compete with each other in search unless
 * each declares the others. hreflang is what tells a search engine they are
 * translations rather than duplicates, and it is only correct if every page
 * lists every language including itself, plus an x-default.
 */

/** Empty until SITE_URL is set; relative URLs still work, absolutes are skipped. */
export function siteOrigin(): string {
  return (operator.siteUrl || process.env.SITE_URL || "").replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const origin = siteOrigin();
  const clean = path.startsWith("/") ? path : `/${path}`;
  return origin ? `${origin}${clean}` : clean;
}

/**
 * @param path route below the locale segment, e.g. "/explore" or "" for home.
 */
export function localeAlternates(locale: string, path = "") {
  const languages = Object.fromEntries(
    locales.map((code) => [code, absoluteUrl(`/${code}${path}`)]),
  );
  return {
    canonical: absoluteUrl(`/${locale}${path}`),
    languages: {
      ...languages,
      // Sends anyone we have no translation for to the base language.
      "x-default": absoluteUrl(`/${routing.defaultLocale}${path}`),
    },
  };
}
