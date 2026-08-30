import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { SERVICE_NAME } from "@/config/site";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");

  return (
    <footer className="mt-16 border-t border-line bg-paper/70">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-ink-soft">
        <p className="font-display text-base font-extrabold text-ink">{SERVICE_NAME}</p>
        <p className="mt-2 max-w-2xl">{t("prototype")}</p>
        <p className="mt-1 max-w-2xl">{t("partners")}</p>
        <NextLink
          href="/dashboard"
          className="mt-4 inline-block font-bold text-grape hover:underline"
        >
          {tn("dashboard")} →
        </NextLink>
      </div>
    </footer>
  );
}
