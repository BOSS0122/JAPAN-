import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import type { LocalizedText } from "@/data/types";

/** Falls back to the default locale so a half-translated dataset never renders blank. */
export function t(text: LocalizedText, locale: string): string {
  return text[locale as Locale] ?? text[routing.defaultLocale];
}
