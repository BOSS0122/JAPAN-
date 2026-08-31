import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** A dead end should still offer the two things people came for. */
export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="mx-auto max-w-lg space-y-5 py-12 text-center">
      <p aria-hidden className="text-6xl">
        🗺️
      </p>
      <h1 className="font-display text-3xl font-extrabold text-ink">{t("notFoundTitle")}</h1>
      <p className="text-base text-ink-soft">{t("notFoundBody")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/explore" className="jq-btn jq-btn-accent">
          {t("browsePlaces")}
        </Link>
        <Link href="/" className="jq-btn jq-btn-ghost">
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
