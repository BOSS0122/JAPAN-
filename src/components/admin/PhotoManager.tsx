import {
  addPlacePhotoAction,
  deletePlacePhotoAction,
  movePlacePhotoAction,
} from "@/actions/admin";

/**
 * Photographs for one place. Server-rendered forms throughout: an upload is a
 * multipart POST, and the reorder buttons are single-purpose submissions, so
 * the whole panel works with JavaScript unavailable.
 */

const MESSAGES: Record<string, { text: string; tone: "ok" | "bad" }> = {
  added: { text: "写真を追加しました。", tone: "ok" },
  deleted: { text: "写真を削除しました。", tone: "ok" },
  missing: { text: "ファイルを選んでください。", tone: "bad" },
  alt: { text: "代替テキスト（説明）は必須です。", tone: "bad" },
  type: { text: "JPEG・PNG・WebP・AVIF、8MBまでです。", tone: "bad" },
  limit: { text: "1スポットにつき8枚までです。", tone: "bad" },
};

export interface PhotoRow {
  id: string;
  url: string;
  alt: string;
  credit: string;
  creditUrl: string | null;
}

export function PhotoManager({
  slug,
  photos,
  notice,
}: {
  slug: string;
  photos: PhotoRow[];
  notice?: string;
}) {
  const message = notice ? MESSAGES[notice] : undefined;

  return (
    <section className="jq-card space-y-5 p-5">
      <div>
        <h2 className="font-display text-lg font-extrabold text-ink">写真</h2>
        <p className="mt-1 text-sm text-ink-soft">
          先頭の1枚がカードと詳細ページの主役になります。写真が1枚もない場合は
          絵文字とグラデーションで表示されるので、途中でも崩れません。
        </p>
      </div>

      {message && (
        <p
          className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
            message.tone === "ok" ? "bg-matcha-soft text-matcha" : "bg-berry-soft text-berry"
          }`}
        >
          {message.text}
        </p>
      )}

      {photos.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {photos.map((photo, index) => (
            <li key={photo.id} className="overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt}
                className="h-40 w-full bg-cream object-cover"
              />
              <div className="space-y-2 p-3">
                <p className="flex items-center gap-2">
                  {index === 0 && (
                    <span className="jq-chip bg-grape-soft text-grape">メイン</span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                    {photo.alt}
                  </span>
                </p>
                {photo.credit && (
                  <p className="truncate text-xs text-ink-soft">© {photo.credit}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <MoveButton slug={slug} id={photo.id} direction="up" disabled={index === 0}>
                    ↑ 前へ
                  </MoveButton>
                  <MoveButton
                    slug={slug}
                    id={photo.id}
                    direction="down"
                    disabled={index === photos.length - 1}
                  >
                    ↓ 後へ
                  </MoveButton>
                  <form action={deletePlacePhotoAction} className="ml-auto">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={photo.id} />
                    <button type="submit" className="jq-btn jq-btn-ghost jq-chip text-berry">
                      削除
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        action={addPlacePhotoAction}
        encType="multipart/form-data"
        className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2"
      >
        <input type="hidden" name="slug" value={slug} />
        <div className="sm:col-span-2">
          <label className="jq-label" htmlFor="photo-file">
            画像ファイル
          </label>
          <input
            id="photo-file"
            name="file"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="jq-field file:mr-3 file:rounded-lg file:border-0 file:bg-grape file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="jq-label" htmlFor="photo-alt">
            代替テキスト（英語・必須）
          </label>
          <input
            id="photo-alt"
            name="alt"
            required
            maxLength={200}
            placeholder="Wooden teahouse fronts along a wet cobbled street at dawn"
            className="jq-field"
          />
          <p className="mt-1 text-xs text-ink-soft">
            読み上げソフトが読む説明です。「写真」ではなく、写っているものを書いてください。
          </p>
        </div>
        <div>
          <label className="jq-label" htmlFor="photo-credit">
            撮影者・出典
          </label>
          <input id="photo-credit" name="credit" className="jq-field" />
        </div>
        <div>
          <label className="jq-label" htmlFor="photo-credit-url">
            出典URL
          </label>
          <input id="photo-credit-url" name="creditUrl" type="url" className="jq-field" />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="jq-btn jq-btn-accent">
            写真を追加
          </button>
        </div>
      </form>
    </section>
  );
}

function MoveButton({
  slug,
  id,
  direction,
  disabled,
  children,
}: {
  slug: string;
  id: string;
  direction: "up" | "down";
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <form action={movePlacePhotoAction}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button type="submit" disabled={disabled} className="jq-btn jq-btn-ghost jq-chip disabled:opacity-30">
        {children}
      </button>
    </form>
  );
}
