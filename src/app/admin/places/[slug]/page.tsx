import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deletePlaceAction, isAdmin } from "@/actions/admin";
import { getPlaceForAdmin } from "@/lib/repo/places";
import { PlaceForm } from "@/components/admin/PlaceForm";

export default async function EditPlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { slug } = await params;
  const { saved } = await searchParams;
  const row = await getPlaceForAdmin(slug);
  if (!row) notFound();

  return (
    <div className="space-y-8">
      <PlaceForm row={row} saved={saved === "1"} />

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
          {/* Separate form so a stray Enter in the editor cannot trigger it. */}
          <form action={deletePlaceAction}>
            <input type="hidden" name="originalSlug" value={row.slug} />
            <button type="submit" className="jq-btn jq-btn-ghost text-berry">
              削除する
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
