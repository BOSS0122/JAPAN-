import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePlaceAction } from "@/actions/admin";
import { requireEditor } from "@/lib/auth/editor";
import { getPlaceForAdmin } from "@/lib/repo/places";
import { listRevisionsForPlace } from "@/lib/repo/revisions";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { PlaceForm } from "@/components/admin/PlaceForm";
import { draftingAvailable } from "@/lib/providers";
import { RevisionList } from "@/components/admin/RevisionList";

export default async function EditPlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; photo?: string }>;
}) {
  const me = await requireEditor();

  const { slug } = await params;
  const { saved, photo } = await searchParams;
  const [row, revisions] = await Promise.all([
    getPlaceForAdmin(slug),
    listRevisionsForPlace(slug),
  ]);
  if (!row) notFound();

  return (
    <div className="space-y-8">
      <PlaceForm row={row} saved={saved === "1"} draftingAvailable={draftingAvailable()} />

      <PhotoManager slug={row.slug} photos={row.photos} notice={photo} />

      <section className="jq-card p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">このスポットの編集履歴</h2>
        <div className="mt-3">
          <RevisionList revisions={revisions} showSlug={false} />
        </div>
      </section>

      <section className="jq-card border-2 border-berry/40 p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">危険な操作</h2>
        <p className="mt-1 text-sm text-ink-soft">
          削除すると翻訳もタグも一緒に消え、元に戻せません。公開を止めたいだけなら
          「下書きに戻す」を使ってください。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link href={`/en/places/${row.slug}`} className="jq-btn jq-btn-ghost">
            旅行者向けページを見る
          </Link>
          <Link href={`/admin/places/new?from=${row.slug}`} className="jq-btn jq-btn-ghost">
            これを複製して新規作成
          </Link>
          {me.role === "admin" ? (
            /* Separate form so a stray Enter in the editor cannot trigger it. */
            <form action={deletePlaceAction}>
              <input type="hidden" name="originalSlug" value={row.slug} />
              <button type="submit" className="jq-btn jq-btn-ghost text-berry">
                削除する
              </button>
            </form>
          ) : (
            <p className="text-sm text-ink-soft">削除は管理者のみが行えます。</p>
          )}
        </div>
      </section>
    </div>
  );
}
