import Link from "next/link";
import { bulkSetStatusAction, setPlaceStatusAction } from "@/actions/admin";
import { requireEditor } from "@/lib/auth/editor";
import { listPlacesForAdmin } from "@/lib/repo/places";
import { routing } from "@/i18n/routing";

const STATUS_LABEL: Record<string, string> = {
  published: "公開中",
  pending: "審査待ち",
  draft: "下書き",
};

const STATUS_STYLE: Record<string, string> = {
  published: "bg-matcha-soft text-matcha",
  pending: "bg-sunshine-soft text-[#8a5b00]",
  draft: "bg-cream text-ink-soft",
};

type Search = {
  denied?: string;
  deleted?: string;
  q?: string;
  status?: string;
  gap?: string;
  bulk?: string;
  skipped?: string;
};

export default async function AdminPlacesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const me = await requireEditor();

  const sp = await searchParams;
  const { denied, deleted, bulk, skipped } = sp;
  const q = (sp.q ?? "").trim();
  const status =
    sp.status === "published" || sp.status === "draft" || sp.status === "pending"
      ? sp.status
      : undefined;
  const isPartner = me.role === "partner";
  const gap = sp.gap === "translation" || sp.gap === "photo" ? sp.gap : undefined;

  const rows = await listPlacesForAdmin({
    q: q || undefined,
    status,
    needsTranslation: gap === "translation",
    needsPhoto: gap === "photo",
    // Scoped from the session, never from the query string.
    ownerEditorId: isPartner ? me.id : undefined,
  });

  const filtered = Boolean(q || status || gap);
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
      {bulk && (
        <p className="jq-card p-4 text-sm text-ink">
          <strong className="text-matcha">{bulk}件</strong>の状態を変更しました。
          {Number(skipped) > 0 && (
            <span className="ml-2 font-bold text-berry">
              {skipped}件は翻訳が未完了のため公開しませんでした。
            </span>
          )}
        </p>
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

      {/* GET, so a filtered view is a URL an editor can bookmark or send. */}
      <form className="jq-card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[16rem] flex-1">
          <label className="jq-label" htmlFor="q">
            検索
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="名称・スラッグ・エリア・県"
            className="jq-field"
          />
        </div>
        <div>
          <label className="jq-label" htmlFor="status">
            状態
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className="jq-field">
            <option value="">すべて</option>
            <option value="published">公開中</option>
            <option value="pending">審査待ち</option>
            <option value="draft">下書き</option>
          </select>
        </div>
        <div>
          <label className="jq-label" htmlFor="gap">
            不足
          </label>
          <select id="gap" name="gap" defaultValue={gap ?? ""} className="jq-field">
            <option value="">指定なし</option>
            <option value="translation">翻訳が未完了</option>
            <option value="photo">写真がない</option>
          </select>
        </div>
        <button type="submit" className="jq-btn jq-btn-accent">
          絞り込む
        </button>
        {filtered && (
          <Link href="/admin/places" className="jq-btn jq-btn-ghost">
            解除
          </Link>
        )}
        <p className="w-full text-xs text-ink-soft">
          {filtered ? `${rows.length}件が該当` : `全${rows.length}件`}
        </p>
      </form>

      {/* The toolbar is the whole form; the checkboxes join it by id. Wrapping
          the table instead would nest it around each row's own toggle form,
          which is invalid and silently breaks both. */}
      {!isPartner && <form id="bulk" action={bulkSetStatusAction} />}

      <div className="jq-card overflow-hidden">
        {!isPartner && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-cream px-4 py-3">
          <p className="text-sm font-bold text-ink">選択した行を:</p>
          <button
            type="submit"
            form="bulk"
            name="status"
            value="published"
            className="jq-btn jq-btn-ghost jq-chip"
          >
            公開する
          </button>
          <button
            type="submit"
            form="bulk"
            name="status"
            value="draft"
            className="jq-btn jq-btn-ghost jq-chip"
          >
            下書きに戻す
          </button>
          <p className="text-xs text-ink-soft">
            翻訳が未完了のスポットは、一括公開の対象から外れます。
          </p>
        </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                {!isPartner && (
                  <th className="w-10 px-4 py-3">
                    <span className="sr-only">選択</span>
                  </th>
                )}
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
                    {!isPartner && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          form="bulk"
                          name="slug"
                          value={row.slug}
                          aria-label={`${ja?.name || row.slug} を選択`}
                          className="h-4 w-4 accent-[#7c4dff]"
                        />
                      </td>
                    )}
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
                      <span className={`jq-chip ${STATUS_STYLE[row.status] ?? STATUS_STYLE.draft}`}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                      {row.owner && !isPartner && (
                        <p className="mt-1 text-xs text-ink-soft">{row.owner.name}</p>
                      )}
                      {row.reviewNote && (
                        <p className="mt-1 max-w-[16rem] text-xs text-berry">
                          差し戻し: {row.reviewNote}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPartner ? (
                        row.status === "draft" && (
                          <form action={setPlaceStatusAction} className="inline-block">
                            <input type="hidden" name="slug" value={row.slug} />
                            <input type="hidden" name="status" value="pending" />
                            <button type="submit" className="jq-btn jq-btn-ghost jq-chip">
                              審査に出す
                            </button>
                          </form>
                        )
                      ) : (
                        <>
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
                        </>
                      )}
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
          {filtered
            ? "条件に合うスポットがありません。"
            : "まだスポットがありません。「新規スポット」から追加してください。"}
        </p>
      )}
    </div>
  );
}
