import { areaRows, topPlaces, totals } from "@/data/analytics";
import {
  AreaChartByRegion,
  CategoryPie,
  TrendChart,
} from "@/components/DashboardCharts";

const CATEGORY_LABEL = {
  spot: "Sight 観光地",
  experience: "Experience 体験",
  restaurant: "Food 飲食店",
} as const;

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
      <p className="mt-2 font-display text-3xl font-extrabold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const conversion = ((totals.bookings / totals.views) * 100).toFixed(2);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">
          送客データダッシュボード
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Referral analytics — sample data, last 12 weeks. すべてダミーデータです。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Views"
          sub="スポット閲覧数"
          value={totals.views.toLocaleString()}
          accent="#7c4dff"
        />
        <Kpi
          label="Referrals"
          sub="予約送客数"
          value={totals.referrals.toLocaleString()}
          accent="#0e9cb8"
        />
        <Kpi
          label="Bookings"
          sub="成約数"
          value={totals.bookings.toLocaleString()}
          accent="#ff3d71"
        />
        <Kpi
          label="Conversion"
          sub="閲覧→成約率"
          value={`${conversion}%`}
          accent="#16a06a"
        />
      </div>

      <section className="jq-card p-5">
        <h2 className="mb-4 font-display text-lg font-extrabold text-ink">
          週次推移 <span className="text-sm font-bold text-ink-soft">Weekly trend</span>
        </h2>
        <TrendChart />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="jq-card p-5">
          <h2 className="mb-4 font-display text-lg font-extrabold text-ink">
            エリア別 <span className="text-sm font-bold text-ink-soft">By area</span>
          </h2>
          <AreaChartByRegion />
        </section>

        <section className="jq-card p-5">
          <h2 className="mb-4 font-display text-lg font-extrabold text-ink">
            種別構成 <span className="text-sm font-bold text-ink-soft">By category</span>
          </h2>
          <CategoryPie />
        </section>
      </div>

      <section className="jq-card overflow-hidden">
        <h2 className="border-b border-line bg-cream px-5 py-4 font-display text-lg font-extrabold text-ink">
          エリア別サマリー{" "}
          <span className="text-sm font-bold text-ink-soft">Area summary</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Area エリア</th>
                <th className="px-5 py-3">Prefecture 県</th>
                <th className="px-5 py-3 text-right">Views 閲覧</th>
                <th className="px-5 py-3 text-right">Referrals 送客</th>
                <th className="px-5 py-3 text-right">Bookings 成約</th>
                <th className="px-5 py-3 text-right">Hidden gems 穴場比率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {areaRows.map((row) => (
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
                  <td className="px-5 py-3 text-right tabular-nums">
                    {row.hiddenGemShare}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="jq-card overflow-hidden">
        <h2 className="border-b border-line bg-cream px-5 py-4 font-display text-lg font-extrabold text-ink">
          人気スポット上位{" "}
          <span className="text-sm font-bold text-ink-soft">Top places</span>
        </h2>
        <ol className="divide-y divide-line">
          {topPlaces.map((place, i) => (
            <li key={place.id} className="flex items-center gap-4 px-5 py-3 text-sm">
              <span className="w-6 font-display text-lg font-extrabold text-ink-soft">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{place.name}</p>
                <p className="text-xs text-ink-soft">
                  {place.area} · {CATEGORY_LABEL[place.category]}
                  {!place.famous && <span className="ml-1 text-berry">💎 穴場</span>}
                </p>
              </div>
              <span className="tabular-nums text-ink-soft">
                {place.views.toLocaleString()} views
              </span>
              <span className="tabular-nums font-bold text-ink">
                {place.bookings.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
