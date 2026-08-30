import { getTranslations, setRequestLocale } from "next-intl/server";
import { getUser } from "@/lib/session";
import { signInAction, signOutAction } from "@/actions";
import { DemoNotice } from "@/components/ui";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth");
  const user = await getUser();

  if (user) {
    return (
      <div className="mx-auto max-w-md space-y-4 jq-card p-6 text-center">
        <p aria-hidden className="text-4xl">
          👋
        </p>
        <p className="font-display text-xl font-extrabold text-ink">
          {t("signedInAs", { name: user.name })}
        </p>
        <p className="text-sm text-ink-soft">{user.email}</p>
        <form action={signOutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="jq-btn jq-btn-ghost">
            {t("signOut")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="jq-card space-y-4 p-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">{t("signIn")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t("signInSub")}</p>
        </div>

        <form action={signInAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div>
            <label className="jq-label" htmlFor="email">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="jq-field"
            />
          </div>
          <div>
            <label className="jq-label" htmlFor="name">
              {t("nameLabel")}
            </label>
            <input id="name" name="name" className="jq-field" autoComplete="nickname" />
          </div>
          <div>
            <label className="jq-label" htmlFor="password">
              {t("password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="jq-field"
            />
          </div>
          <button type="submit" className="jq-btn jq-btn-accent w-full">
            {t("submit")}
          </button>
        </form>

        <p className="text-xs text-ink-soft">{t("why")}</p>
        <DemoNotice>{t("signInSub")}</DemoNotice>
      </div>
    </div>
  );
}
