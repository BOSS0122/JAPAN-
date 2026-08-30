import Link from "next/link";
import { setPlaceStatusAction } from "@/actions/admin";
import { requireEditor } from "@/lib/auth/editor";
import { listPlacesForAdmin } from "@/lib/repo/places";
import { routing } from "@/i18n/routing";

export default async function AdminPlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; deleted?: string }>;
}) {
  await requireEditor();

  const { denied, deleted } = await searchParams;
  const rows = await listPlacesForAdmin();
  const published = rows.filter((r) => r.status === "published").length;

  // Which languages are still missing text — the thing that blocks publishing.
  const missing = (row: (typeof rows)[number]) =>
    routing.locales.filter(
      (locale) => !row.translations.some((t) => t.locale === locale && t.name.trim()),
    );

  return (
    <div className="space-y-6">
      {denied && (
        <p className="jq-card border-2 border-berry/40 p-4 text-sm font-bold text-berry">
          その操作は管理者のみが行えます。
        </p>
      )}
      {deleted && (
        <p className="jq-card p-4 text-sm font-bold text-matcha">スポットを削除しました。</p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">スポット</h1>
          <p className="text-sm text-ink-soft">
            全{rows.length}件 · 公開{published}件 · 下書き{rows.length - published}件
          </p>
        </div>
        <Link href="/admin/places/new" className="jq-btn jq-btn-accent">
          ＋ 新規スポット
        </Link>
      </div>

      <div className="jq-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">種別</th>
                <th className="px-4 py-3">エリア</th>
                <th className="px-4 py-3">翻訳</th>
                <th className="px-4 py-3">状態</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => {
                const ja = row.translations.find((t) => t.locale === "ja");
                const gaps = missing(row);
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/places/${row.slug}`}
                        className="font-bold text-ink hover:text-grape"
                      >
                        {ja?.name || row.slug}
                      </Link>
                      <p className="font-mono text-xs text-ink-soft">{row.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{row.category}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {row.areaKey}
                      <span className="ml-1 text-xs">({row.prefecture})</span>
                    </td>
                    <td className="px-4 py-3">
                      {gaps.length === 0 ? (
                        <span className="jq-chip bg-matcha-soft text-matcha">揃っています</span>
                      ) : (
                        <span className="jq-chip bg-sunshine-soft text-[#8a5b00]">
                          未入力: {gaps.join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`jq-chip ${
                          row.status === "published"
                            ? "bg-matcha-soft text-matcha"
                            : "bg-cream text-ink-soft"
                        }`}
                      >
                        {row.status === "published" ? "公開中" : "下書き"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/places/new?from=${row.slug}`}
                        className="mr-2 text-xs font-bold text-grape hover:underline"
                      >
                        複製
                      </Link>
                      <form action={setPlaceStatusAction} className="mt-1 inline-block">
                        <input type="hidden" name="slug" value={row.slug} />
                        <input
                          type="hidden"
                          name="status"
                          value={row.status === "published" ? "draft" : "published"}
                        />
                        <button type="submit" className="jq-btn jq-btn-ghost jq-chip">
                          {row.status === "published" ? "下書きに戻す" : "公開する"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="jq-card p-8 text-center text-sm text-ink-soft">
          まだスポットがありません。「新規スポット」から追加してください。
        </p>
      )}
    </div>
  );
}
