import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDisplayName } from "@/lib/session";
import { clearDisplayNameAction, setDisplayNameAction } from "@/actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "you" });
  return { title: t("title"), robots: { index: false } };
}

export default async function YouPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("you");
  const name = await getDisplayName();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="jq-card space-y-4 p-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">{t("title")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t("subtitle")}</p>
        </div>

        <form action={setDisplayNameAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <div>
            <label className="jq-label" htmlFor="name">
              {t("nameLabel")}
            </label>
            <input
              id="name"
              name="name"
              defaultValue={name ?? ""}
              maxLength={40}
              autoComplete="nickname"
              placeholder={t("placeholder")}
              className="jq-field"
            />
          </div>
          <button type="submit" className="jq-btn jq-btn-accent w-full">
            {t("save")}
          </button>
        </form>

        {name && (
          <form action={clearDisplayNameAction} className="border-t border-line pt-3">
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="text-sm font-bold text-berry hover:underline">
              {t("clear")}
            </button>
          </form>
        )}

        <p className="border-t border-line pt-3 text-xs text-ink-soft">{t("noAccount")}</p>
      </div>
    </div>
  );
}
