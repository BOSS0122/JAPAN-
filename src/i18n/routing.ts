import { defineRouting } from "next-intl/routing";

/**
 * Adding a language = add the code here + drop a matching file in src/messages/.
 * Nothing else in the app hardcodes a locale list.
 */
export const locales = ["en", "ja", "th"] as const;
export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  ja: { label: "日本語", flag: "🇯🇵" },
  th: { label: "ไทย", flag: "🇹🇭" },
};

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});
