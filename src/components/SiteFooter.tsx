import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SERVICE_NAME } from "@/config/site";

const LEGAL = ["privacy", "terms", "commerce"] as const;

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");

  return (
    <footer className="mt-16 border-t border-line bg-paper/70">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-ink-soft">
        <p className="font-display text-base font-extrabold text-ink">{SERVICE_NAME}</p>
        <p className="mt-2 max-w-2xl">{t("prototype")}</p>
        <p className="mt-1 max-w-2xl">{t("partners")}</p>
        {/* Required to be reachable from every page, not buried one level down. */}
        <nav className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
          {LEGAL.map((doc) => (
            <Link
              key={doc}
              href={`/legal/${doc}`}
              className="font-bold text-ink-soft hover:text-grape hover:underline"
            >
              {t(doc)}
            </Link>
          ))}
          <NextLink
            href="/dashboard"
            className="font-bold text-grape hover:underline"
          >
            {tn("dashboard")} →
          </NextLink>
        </nav>
      </div>
    </footer>
  );
}
