import Link from "next/link";
import {
  areaRollup,
  categoryRollup,
  dailySeries,
  revenueSince,
  windowStart,
  windowStartDay,
} from "@/lib/repo/revenue";
import { RevenueSparkline } from "@/components/admin/RevenueSparkline";

/**
 * The partner-facing console — what a tourism board or a venue is shown.
 *
 * Every number here is now measured rather than sampled. That is the whole
 * point: a console you can sell is one whose figures you can stand behind, and
 * a zero we can explain is worth more than a plausible invented number.
 */

const CATEGORY_LABEL: Record<string, string> = {
  spot: "Sight 観光地",
  experience: "Experience 体験",
  restaurant: "Food 飲食店",
};

const CATEGORY_COLOUR: Record<string, string> = {
  spot: "#7c4dff",
  experience: "#eb6834",
  restaurant: "#1baf7a",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const requested = Number((await searchParams).days);
  const days = [7, 28, 90].includes(requested) ? requested : 28;
  const sinceDay = windowStartDay(days);

  const [totals, areas, categories, series] = await Promise.all([
    revenueSince(windowStart(days)),
    areaRollup(sinceDay),
    categoryRollup(sinceDay),
    dailySeries(days),
  ]);

  const views = areas.reduce((sum, a) => sum + a.views, 0);
  // Every hand-off, including flight and hotel searches that belong to no one
  // place. The per-area table below counts only the place-attributed subset,
  // which is why the two figures differ and are labelled differently.
  const referrals = totals.partnerClicks;
  const placeReferrals = areas.reduce((sum, a) => sum + a.referrals, 0);
  const bookings = areas.reduce((sum, a) => sum + a.bookings, 0);
  const conversion = views === 0 ? null : ((bookings / views) * 100).toFixed(2);
  const categoryTotal = categories.reduce((sum, c) => sum + c.views, 0);
  const empty = views === 0 && referrals === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            送客データダッシュボード
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Referral analytics — 実測値のみ。直近{days}日。
          </p>
        </div>
        <nav className="flex gap-2">
          {[7, 28, 90].map((n) => (
            <Link
              key={n}
              href={`/dashboard?days=${n}`}
              className={`jq-chip border-2 ${
                n === days
                  ? "border-grape bg-grape text-white"
                  : "border-line bg-paper text-ink-soft hover:border-grape"
              }`}
            >
              {n}日
            </Link>
          ))}
        </nav>
      </div>

      {empty && (
        <p className="jq-card border-2 border-line p-5 text-sm text-ink-soft">
          この期間の計測データはまだありません。旅行者向けページが閲覧され、提携先への
          送客や予約が発生すると、ここに実測値が入ります。
          <span className="mt-1 block text-xs">
            以前このページに表示していたサンプル数値は削除しました。partner に見せる画面に
            架空の数字を置くと、どこまでが本物か誰にも分からなくなります。
          </span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Views" sub="スポット閲覧数" value={views.toLocaleString()} accent="#7c4dff" />
        <Kpi
          label="Referrals"
          sub="提携先への送客数（全体）"
          value={referrals.toLocaleString()}
          accent="#eb6834"
        />
        <Kpi
          label="Bookings"
          sub="成約数（予約＋物販）"
          value={bookings.toLocaleString()}
          accent="#1baf7a"
        />
        <Kpi
          label="Conversion"
          sub="閲覧→成約率"
          value={conversion === null ? "—" : `${conversion}%`}
          accent="#eda100"
        />
      </div>

      <section className="jq-card p-5">
        <h2 className="mb-1 font-display text-lg font-extrabold text-ink">
          日次推移 <span className="text-sm font-bold text-ink-soft">Daily trend</span>
        </h2>
        <p className="mb-4 text-xs text-ink-soft">
          単位が三桁違うので、共通の軸に重ねず個別の縦軸で並べています。
        </p>
        <RevenueSparkline series={series} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="jq-card p-5">
          <h2 className="mb-4 font-display text-lg font-extrabold text-ink">
            エリア別 <span className="text-sm font-bold text-ink-soft">By area</span>
          </h2>
          {areas.length === 0 ? (
            <p className="text-sm text-ink-soft">データなし</p>
          ) : (
            <ul className="space-y-2.5">
              {areas.slice(0, 10).map((area) => (
                <li key={area.areaKey} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs font-bold text-ink">
                    {area.areaLabel}
                  </span>
                  <span className="h-3 flex-1 overflow-hidden rounded-full bg-cream">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(2, (area.views / areas[0].views) * 100)}%`,
                        backgroundColor: "#7c4dff",
                      }}
                    />
                  </span>
                  <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums text-ink-soft">
                    {area.views.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="jq-card p-5">
          <h2 className="mb-4 font-display text-lg font-extrabold text-ink">
            種別構成 <span className="text-sm font-bold text-ink-soft">By category</span>
          </h2>
          {categoryTotal === 0 ? (
            <p className="text-sm text-ink-soft">データなし</p>
          ) : (
            <ul className="space-y-3">
              {categories
                .sort((a, b) => b.views - a.views)
                .map((row) => (
                  <li key={row.category}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-ink">
                        <span
                          aria-hidden
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLOUR[row.category] ?? "#7c4dff" }}
                        />
                        {CATEGORY_LABEL[row.category] ?? row.category}
                      </span>
                      <span className="tabular-nums text-ink-soft">
                        {Math.round((row.views / categoryTotal) * 100)}%
                      </span>
                    </div>
                    <span className="mt-1 block h-3 overflow-hidden rounded-full bg-cream">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${(row.views / categoryTotal) * 100}%`,
                          backgroundColor: CATEGORY_COLOUR[row.category] ?? "#7c4dff",
                        }}
                      />
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <section className="jq-card overflow-hidden">
        <h2 className="border-b border-line bg-cream px-5 py-4 font-display text-lg font-extrabold text-ink">
          エリア別サマリー <span className="text-sm font-bold text-ink-soft">Area summary</span>
          <span className="ml-2 text-xs font-bold text-ink-soft">
            スポット経由の送客 {placeReferrals.toLocaleString()} 件（航空券・宿泊の検索は
            特定のスポットに紐づかないため、上の Referrals とは一致しません）
          </span>
        </h2>
        {areas.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-soft">データなし</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-5 py-3">Area エリア</th>
                  <th className="px-5 py-3">Prefecture 県</th>
                  <th className="px-5 py-3 text-right">Views 閲覧</th>
                  <th className="px-5 py-3 text-right">Referrals スポット経由の送客</th>
                  <th className="px-5 py-3 text-right">Bookings 成約</th>
                  <th className="px-5 py-3 text-right">Hidden gems 穴場比率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {areas.map((row) => (
                  <tr key={row.areaKey}>
                    <td className="px-5 py-3 font-bold text-ink">{row.areaLabel}</td>
                    <td className="px-5 py-3 text-ink-soft">{row.prefecture}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {row.views.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {row.referrals.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {row.bookings.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{row.hiddenGemShare}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  sub,
  value,
  accent,
}: {
  label: string;
  sub: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="jq-card p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="text-xs text-ink-soft">{sub}</p>
      <p className="mt-2 font-display text-3xl font-extrabold tabular-nums" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
