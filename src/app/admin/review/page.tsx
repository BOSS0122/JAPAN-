import Link from "next/link";
import { requireStaff } from "@/lib/auth/editor";
import { listPendingSubmissions } from "@/lib/repo/places";
import { locales, localeLabels, type Locale } from "@/i18n/routing";
import { approveSubmissionAction, returnSubmissionAction } from "@/actions/admin";

/**
 * Submissions waiting on a decision.
 *
 * Oldest first, because it is a queue and a partner waiting a week is the
 * failure this screen exists to prevent. Everything needed to decide is on the
 * card — the three languages, the photos, who sent it — so approving does not
 * require opening another tab and losing your place.
 */
const ERRORS: Record<string, string> = {
  translation: "翻訳が未完了のため公開できません。差し戻すか、編集して補ってください。",
  note: "差し戻しには理由が必要です。",
};

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ approved?: string; returned?: string; error?: string; slug?: string }>;
}) {
  await requireStaff();
  const { approved, returned, error, slug } = await searchParams;
  const rows = await listPendingSubmissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">審査待ち</h1>
        <p className="text-sm text-ink-soft">
          加盟店から提出された掲載です。承認するまで旅行者には表示されません。古い順。
        </p>
      </div>

      {approved && (
        <p className="jq-card p-4 text-sm font-bold text-matcha">承認して公開しました。</p>
      )}
      {returned && (
        <p className="jq-card p-4 text-sm font-bold text-ink">差し戻しました。</p>
      )}
      {error && ERRORS[error] && (
        <p className="jq-card border-2 border-berry p-4 text-sm font-bold text-berry">
          {ERRORS[error]}
          {slug && <span className="ml-1 font-mono text-xs">({slug})</span>}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="jq-card p-8 text-center text-sm text-ink-soft">
          審査待ちはありません。
        </p>
      ) : (
        <ol className="space-y-6">
          {rows.map((row) => {
            const named = new Set(
              row.translations.filter((t) => t.name.trim()).map((t) => t.locale),
            );
            const missing = locales.filter((l) => !named.has(l));
            const ja = row.translations.find((t) => t.locale === "ja");

            return (
              <li key={row.id} className="jq-card space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/places/${row.slug}`}
                      className="font-display text-lg font-extrabold text-ink hover:text-grape"
                    >
                      {ja?.name || row.slug}
                    </Link>
                    <p className="font-mono text-xs text-ink-soft">{row.slug}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {row.owner ? `${row.owner.name}（${row.owner.email}）` : "提出者不明"}
                      {" · "}
                      {row.category} · {row.areaKey}, {row.prefecture}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {missing.length > 0 ? (
                      <span className="jq-chip bg-berry-soft text-berry">
                        未入力: {missing.map((l) => localeLabels[l as Locale].label).join("・")}
                      </span>
                    ) : (
                      <span className="jq-chip bg-matcha-soft text-matcha">3言語そろっています</span>
                    )}
                    <span className="jq-chip bg-cream text-ink-soft">
                      写真 {row.photos.length}枚
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  {locales.map((locale) => {
                    const t = row.translations.find((x) => x.locale === locale);
                    return (
                      <div key={locale} className="rounded-xl border border-line p-3">
                        <p className="jq-chip bg-grape-soft text-grape">
                          {localeLabels[locale as Locale].label}
                        </p>
                        <p className="mt-1.5 font-display text-sm font-extrabold text-ink">
                          {t?.name || "—"}
                        </p>
                        <p className="text-xs text-ink-soft">{t?.area || "—"}</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                          {t?.description || "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {row.photos.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {row.photos.map((photo) => (
                      <li key={photo.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.alt}
                          className="h-20 w-28 rounded-lg border border-line object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
                  <form action={approveSubmissionAction}>
                    <input type="hidden" name="slug" value={row.slug} />
                    <button
                      type="submit"
                      className="jq-btn jq-btn-accent"
                      disabled={missing.length > 0}
                    >
                      承認して公開
                    </button>
                  </form>

                  {/* Separate form: a reason is required, and one endpoint doing
                      both makes it easy to approve by accident. */}
                  <form action={returnSubmissionAction} className="flex flex-1 flex-wrap items-end gap-2">
                    <input type="hidden" name="slug" value={row.slug} />
                    <div className="min-w-[14rem] flex-1">
                      <label className="jq-label" htmlFor={`note-${row.id}`}>
                        差し戻す理由（加盟店に表示されます）
                      </label>
                      <input
                        id={`note-${row.id}`}
                        name="note"
                        required
                        maxLength={1000}
                        placeholder="例: 営業時間が実際と違うようです。確認をお願いします。"
                        className="jq-field"
                      />
                    </div>
                    <button type="submit" className="jq-btn jq-btn-ghost text-berry">
                      差し戻す
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
