import Link from "next/link";
import { savePlaceAction } from "@/actions/admin";
import { locales, localeLabels } from "@/i18n/routing";
import { INTEREST_TAGS } from "@/data/types";
import { DEFAULT_BOOKING_COMMISSION_PCT } from "@/config/revenue";

export interface PlaceFormRow {
  slug: string;
  category: string;
  areaKey: string;
  prefecture: string;
  famous: boolean;
  lat: number;
  lng: number;
  stayMinutes: number;
  crowd: string;
  indoor: boolean;
  accessible: boolean;
  openHour: number;
  closeHour: number;
  priceFrom: number | null;
  bookable: boolean;
  commissionPct: number;
  externalBookingUrl: string | null;
  mealSlot: string | null;
  imageEmoji: string;
  imageFrom: string;
  imageTo: string;
  seasonSpring: number;
  seasonSummer: number;
  seasonAutumn: number;
  seasonWinter: number;
  status: string;
  translations: { locale: string; name: string; description: string; area: string }[];
  tags: { tag: string }[];
}

const BLANK: PlaceFormRow = {
  slug: "",
  category: "spot",
  areaKey: "",
  prefecture: "",
  famous: false,
  lat: 35.6812,
  lng: 139.7671,
  stayMinutes: 60,
  crowd: "normal",
  indoor: false,
  accessible: true,
  openHour: 9,
  closeHour: 17,
  priceFrom: null,
  bookable: false,
  commissionPct: DEFAULT_BOOKING_COMMISSION_PCT,
  externalBookingUrl: null,
  mealSlot: null,
  imageEmoji: "📍",
  imageFrom: "#7c4dff",
  imageTo: "#0e9cb8",
  seasonSpring: 3,
  seasonSummer: 3,
  seasonAutumn: 3,
  seasonWinter: 3,
  status: "draft",
  translations: [],
  tags: [],
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="jq-label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function PlaceForm({
  row,
  saved,
  /** True when `row` is a template being copied, not the record being edited. */
  copiedFrom,
}: {
  row?: PlaceFormRow;
  saved?: boolean;
  copiedFrom?: string;
}) {
  const p = row ?? BLANK;
  const isNew = !row || Boolean(copiedFrom);
  const tags = new Set(p.tags.map((t) => t.tag));
  const tr = (locale: string) => p.translations.find((t) => t.locale === locale);

  return (
    <form action={savePlaceAction} className="space-y-6">
      {!isNew && <input type="hidden" name="originalSlug" value={p.slug} />}
      {copiedFrom && (
        <p className="jq-card p-4 text-sm text-ink-soft">
          <strong className="text-ink">{copiedFrom}</strong>{" "}
          を複製しています。エリア・座標・営業時間・タグ・手数料率は引き継ぎ、
          スラッグと名前・説明は空です。元のスポットは変更されません。
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold text-ink">
          {isNew ? "新規スポット" : tr("ja")?.name || p.slug}
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/places" className="jq-btn jq-btn-ghost">
            一覧へ
          </Link>
          <button type="submit" className="jq-btn jq-btn-accent">
            保存
          </button>
        </div>
      </div>

      {saved && (
        <p className="rounded-xl bg-matcha-soft px-4 py-2 text-sm font-bold text-matcha">
          ✓ 保存しました。公開中のスポットは旅行者向けページに即時反映されます。
        </p>
      )}

      <section className="jq-card space-y-4 p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">基本情報</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="スラッグ (URL・変更しない)" hint="英小文字とハイフン。例: nezu-shrine">
            <input name="slug" defaultValue={p.slug} required className="jq-field font-mono" />
          </Field>
          <Field label="種別">
            <select name="category" defaultValue={p.category} className="jq-field">
              <option value="spot">観光地</option>
              <option value="experience">体験</option>
              <option value="restaurant">飲食店</option>
            </select>
          </Field>
          <Field label="公開状態">
            <select name="status" defaultValue={p.status} className="jq-field">
              <option value="draft">下書き</option>
              <option value="published">公開</option>
            </select>
          </Field>
          <Field label="エリアキー" hint="同じ街は同じ値に。コース提案のまとまりに使います">
            <input name="areaKey" defaultValue={p.areaKey} className="jq-field font-mono" />
          </Field>
          <Field label="都道府県">
            <input name="prefecture" defaultValue={p.prefecture} className="jq-field" />
          </Field>
          <Field label="緯度・経度" hint="Googleマップで右クリック→座標をコピー">
            <div className="flex gap-2">
              <input
                name="lat"
                type="number"
                step="0.000001"
                defaultValue={p.lat}
                className="jq-field"
              />
              <input
                name="lng"
                type="number"
                step="0.000001"
                defaultValue={p.lng}
                className="jq-field"
              />
            </div>
          </Field>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm font-bold text-ink-soft">
            <input
              type="checkbox"
              name="famous"
              defaultChecked={p.famous}
              className="h-4 w-4 accent-[#7c4dff]"
            />
            有名スポット（外すとマイナー扱いでスタンプ2倍）
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-ink-soft">
            <input
              type="checkbox"
              name="indoor"
              defaultChecked={p.indoor}
              className="h-4 w-4 accent-[#7c4dff]"
            />
            主に屋内
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-ink-soft">
            <input
              type="checkbox"
              name="accessible"
              defaultChecked={p.accessible}
              className="h-4 w-4 accent-[#7c4dff]"
            />
            段差なしで行ける
          </label>
        </div>
      </section>

      <section className="jq-card space-y-4 p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">訪問と混雑</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="滞在時間（分）">
            <input
              name="stayMinutes"
              type="number"
              min={5}
              defaultValue={p.stayMinutes}
              className="jq-field"
            />
          </Field>
          <Field label="混雑度">
            <select name="crowd" defaultValue={p.crowd} className="jq-field">
              <option value="quiet">空いている</option>
              <option value="normal">普通</option>
              <option value="busy">混雑</option>
            </select>
          </Field>
          <Field label="開店時刻（0-24）">
            <input
              name="openHour"
              type="number"
              min={0}
              max={24}
              defaultValue={p.openHour}
              className="jq-field"
            />
          </Field>
          <Field label="閉店時刻（0-24）">
            <input
              name="closeHour"
              type="number"
              min={0}
              max={24}
              defaultValue={p.closeHour}
              className="jq-field"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {(
            [
              ["seasonSpring", "春", p.seasonSpring],
              ["seasonSummer", "夏", p.seasonSummer],
              ["seasonAutumn", "秋", p.seasonAutumn],
              ["seasonWinter", "冬", p.seasonWinter],
            ] as const
          ).map(([name, label, value]) => (
            <Field key={name} label={`${label}のおすすめ度 (0-5)`}>
              <input
                name={name}
                type="number"
                min={0}
                max={5}
                defaultValue={value}
                className="jq-field"
              />
            </Field>
          ))}
        </div>
      </section>

      <section className="jq-card space-y-4 p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">予約と価格</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="最低価格（円・任意）">
            <input
              name="priceFrom"
              type="number"
              min={0}
              defaultValue={p.priceFrom ?? ""}
              className="jq-field"
            />
          </Field>
          <Field label="食事の時間帯（飲食店のみ）">
            <select name="mealSlot" defaultValue={p.mealSlot ?? ""} className="jq-field">
              <option value="">指定なし</option>
              <option value="lunch">昼</option>
              <option value="dinner">夜</option>
              <option value="any">どちらでも</option>
            </select>
          </Field>
          <Field label="外部予約URL（任意）">
            <input
              name="externalBookingUrl"
              defaultValue={p.externalBookingUrl ?? ""}
              className="jq-field"
            />
          </Field>
          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-2 text-sm font-bold text-ink-soft">
              <input
                type="checkbox"
                name="bookable"
                defaultChecked={p.bookable}
                className="h-4 w-4 accent-[#7c4dff]"
              />
              サイト内で予約できる
            </label>
          </div>
          <Field label="手数料率（％）">
            <input
              name="commissionPct"
              type="number"
              min={0}
              max={100}
              defaultValue={p.commissionPct}
              className="jq-field"
            />
            <p className="mt-1 text-xs text-ink-soft">
              サイト内予約の取り分。既存の予約には遡及しません。
            </p>
          </Field>
        </div>
      </section>

      <section className="jq-card space-y-4 p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">見た目</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="絵文字">
            <input name="imageEmoji" defaultValue={p.imageEmoji} className="jq-field" />
          </Field>
          <Field label="グラデーション開始">
            <input name="imageFrom" type="color" defaultValue={p.imageFrom} className="jq-field h-11" />
          </Field>
          <Field label="グラデーション終了">
            <input name="imageTo" type="color" defaultValue={p.imageTo} className="jq-field h-11" />
          </Field>
          <div
            className="grid place-items-center rounded-xl text-4xl"
            style={{ backgroundImage: `linear-gradient(135deg, ${p.imageFrom}, ${p.imageTo})` }}
          >
            <span aria-hidden>{p.imageEmoji}</span>
          </div>
        </div>
      </section>

      <section className="jq-card space-y-3 p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">興味タグ</h2>
        <div className="flex flex-wrap gap-2">
          {INTEREST_TAGS.map((tag) => (
            <label
              key={tag}
              className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-line px-3 py-1.5 text-sm font-bold text-ink-soft has-[:checked]:border-grape has-[:checked]:bg-grape-soft has-[:checked]:text-grape"
            >
              <input
                type="checkbox"
                name={`tag_${tag}`}
                defaultChecked={tags.has(tag)}
                className="h-3.5 w-3.5 accent-[#7c4dff]"
              />
              {tag}
            </label>
          ))}
        </div>
      </section>

      {locales.map((locale) => {
        const t = tr(locale);
        return (
          <section key={locale} className="jq-card space-y-4 p-5">
            <h2 className="font-display text-lg font-extrabold text-ink">
              {localeLabels[locale].flag} {localeLabels[locale].label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="名称">
                <input name={`name_${locale}`} defaultValue={t?.name ?? ""} className="jq-field" />
              </Field>
              <Field label="エリア表示名" hint="例: 東京・谷中">
                <input name={`area_${locale}`} defaultValue={t?.area ?? ""} className="jq-field" />
              </Field>
            </div>
            <Field label="紹介文">
              <textarea
                name={`description_${locale}`}
                rows={3}
                defaultValue={t?.description ?? ""}
                className="jq-field"
              />
            </Field>
          </section>
        );
      })}

      <button type="submit" className="jq-btn jq-btn-accent">
        保存
      </button>
    </form>
  );
}
