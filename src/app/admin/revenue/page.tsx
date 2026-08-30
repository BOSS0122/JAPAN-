import Link from "next/link";
import { requireAdmin } from "@/lib/auth/editor";
import {
  dailySeries,
  windowStart,
  windowStartDay,
  partnerBreakdown,
  placeFunnel,
  revenueSince,
} from "@/lib/repo/revenue";
import { AFFILIATE_RATES } from "@/config/revenue";
import { RevenueSparkline } from "@/components/admin/RevenueSparkline";

const yen = (n: number) => `¥${n.toLocaleString()}`;
const pct = (part: number, whole: number) =>
  whole === 0 ? "—" : `${((part / whole) * 100).toFixed(1)}%`;

const SURFACE_LABEL: Record<string, string> = {
  flight: "航空券",
  hotel: "宿泊",
  "place-booking": "外部予約",
  support: "現地サービス",
  shop: "物販",
};

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireAdmin();

  const requested = Number((await searchParams).days);
  const days = [7, 28, 90].includes(requested) ? requested : 28;
  const since = windowStart(days);

  const [totals, partners, funnel, series] = await Promise.all([
    revenueSince(since),
    partnerBreakdown(since),
    placeFunnel(windowStartDay(days)),
    dailySeries(days),
  ]);

  const earned = totals.bookingCommissionJpy + totals.orderCommissionJpy;
  const gross = totals.bookingGrossJpy + totals.orderGrossJpy;
  const views = funnel.reduce((sum, row) => sum + row.views, 0);
  const conversions = funnel.reduce((sum, row) => sum + row.bookings + row.orders, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">収益</h1>
          <p className="text-sm text-ink-soft">
            実データのみ。サンプルは含みません。直近{days}日。
          </p>
        </div>
        <nav className="flex gap-2">
          {[7, 28, 90].map((n) => (
            <Link
              key={n}
              href={`/admin/revenue?days=${n}`}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="確定収益" sub="予約＋物販の手数料" value={yen(earned)} accent="#0f9d58" />
        <Kpi label="流通総額" sub="取扱高（当社売上ではない）" value={yen(gross)} accent="#7c4dff" />
        <Kpi
          label="送客"
          sub="提携先へのクリック"
          value={totals.partnerClicks.toLocaleString()}
          accent="#0e9cb8"
        />
        <Kpi
          label="見込み"
          sub="成約した場合の送客収益"
          value={yen(totals.partnerPipelineJpy)}
          accent="#c2410c"
        />
      </div>

      <p className="jq-card p-4 text-sm text-ink-soft">
        <strong className="text-ink">確定収益</strong>は当社が処理した取引の取り分です。
        <strong className="text-ink">見込み</strong>はクリックが全て成約した場合の理論値で、
        請求根拠にはなりません — 実際に何が売れたかを知っているのは提携先だけです。
        両者を足した数字は出しません。足せば必ず過大評価になります。
      </p>

      <section className="jq-card p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">日次推移</h2>
        <p className="text-xs text-ink-soft">閲覧・送客・予約・手数料</p>
        <div className="mt-4">
          <RevenueSparkline series={series} />
        </div>
      </section>

      <section className="jq-card overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="font-display text-lg font-extrabold text-ink">提携先別の送客</h2>
          <p className="text-xs text-ink-soft">
            棚を使う価値があるのはどこか。料率は
            <code className="mx-1">src/config/revenue.ts</code>
            の仮定値です。
          </p>
        </div>
        {partners.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-ink-soft">この期間の送客はまだありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-cream text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-5 py-3">提携先</th>
                  <th className="px-5 py-3">面</th>
                  <th className="px-5 py-3 text-right">クリック</th>
                  <th className="px-5 py-3 text-right">想定料率</th>
                  <th className="px-5 py-3 text-right">見込み</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {partners.map((row) => (
                  <tr key={`${row.partnerId}-${row.surface}`}>
                    <td className="px-5 py-3 font-bold text-ink">{row.partnerName}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {SURFACE_LABEL[row.surface] ?? row.surface}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink">{row.clicks}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink-soft">
                      {((AFFILIATE_RATES[row.surface] ?? 0) * 100).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink">
                      {yen(row.pipelineJpy)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="jq-card overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="font-display text-lg font-extrabold text-ink">スポット別の漏れ</h2>
          <p className="text-xs text-ink-soft">
            閲覧は多いのに成約が無いスポットは、価格・予約導線・説明文のどれかが原因です。
            全体では閲覧{views.toLocaleString()}件に対し成約{conversions.toLocaleString()}件
            （{pct(conversions, views)}）。
          </p>
        </div>
        {funnel.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-ink-soft">
            まだ計測データがありません。旅行者向けページが閲覧されると貯まります。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="bg-cream text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-5 py-3">スポット</th>
                  <th className="px-5 py-3 text-right">閲覧</th>
                  <th className="px-5 py-3 text-right">送客</th>
                  <th className="px-5 py-3 text-right">予約</th>
                  <th className="px-5 py-3 text-right">物販</th>
                  <th className="px-5 py-3 text-right">成約率</th>
                  <th className="px-5 py-3 text-right">手数料</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {funnel.map((row) => {
                  const converted = row.bookings + row.orders;
                  // Views with nothing to show for them is the actionable case.
                  const leaking = row.views >= 10 && converted === 0;
                  return (
                    <tr key={row.placeSlug} className={leaking ? "bg-sunshine-soft/40" : undefined}>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/places/${row.placeSlug}`}
                          className="font-mono text-xs font-bold text-grape hover:underline"
                        >
                          {row.placeSlug}
                        </Link>
                        {leaking && (
                          <span className="ml-2 jq-chip bg-sunshine-soft text-[#8a5b00]">
                            要確認
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-ink-soft">{row.views}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-ink-soft">
                        {row.partnerClicks}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-ink">{row.bookings}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-ink">{row.orders}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-ink-soft">
                        {pct(converted, row.views)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-bold text-ink">
                        {yen(row.commissionJpy)}
                      </td>
                    </tr>
                  );
                })}
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
      <p className="mt-2 font-display text-2xl font-extrabold tabular-nums" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
