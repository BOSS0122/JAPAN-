"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as Locale;
          startTransition(() => {
            // params keeps dynamic segments (e.g. /places/[id]) intact.
            router.replace(
              // @ts-expect-error -- pathname + params are correlated at runtime
              { pathname, params },
              { locale: next },
            );
          });
        }}
        className="appearance-none rounded-full border-2 border-line bg-paper py-1.5 pl-3 pr-8 text-sm font-bold text-ink outline-none transition hover:border-grape focus:border-grape"
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code].flag} {localeLabels[code].label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 text-xs text-ink-soft"
      >
        ▾
      </span>
    </label>
  );
}
