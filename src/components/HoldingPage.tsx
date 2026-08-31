import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { SERVICE_NAME, site } from "@/config/site";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

/**
 * What the public sees before launch.
 *
 * Deliberately a real page rather than a 503: it is the first impression, and
 * a holding page that says what the service is and when it opens is worth more
 * than an error. No signup form — collecting addresses we have no way to mail
 * yet would be a promise we cannot keep.
 */
export async function HoldingPage({ locale }: { locale: string }) {
  const t = await getTranslations("holding");
  const tagline = site.tagline[locale as keyof typeof site.tagline] ?? site.tagline.en;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-4">
        <p aria-hidden className="text-6xl">
          ⛩️
        </p>
        <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">
          {SERVICE_NAME}
        </h1>
        <p className="font-display text-xl font-bold text-grape">{tagline}</p>
      </div>

      <div className="jq-card space-y-3 p-6">
        <p className="font-display text-lg font-extrabold text-ink">{t("title")}</p>
        <p className="text-base leading-relaxed text-ink-soft">{t("body")}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <LocaleSwitcher />
        <NextLink href="/admin/login" className="text-sm font-bold text-ink-soft hover:underline">
          {t("editorLink")}
        </NextLink>
      </div>
    </main>
  );
}
