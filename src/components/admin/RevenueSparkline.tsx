/**
 * Four measures on one time axis — views, hand-offs, bookings, commission.
 *
 * They differ by three orders of magnitude, so they are small multiples with a
 * scale each, never two y-axes on one plot. A shared x-axis is what lets the
 * eye line up a spike in views against the day it did or did not earn anything.
 *
 * Server-rendered SVG: each point carries a <title>, so hovering names the day
 * and the value without shipping a charting library to read four sparklines.
 *
 * The plot stretches to the container width, so strokes are marked
 * non-scaling and the peak marker is a positioned element rather than an SVG
 * circle — under a non-uniform scale a circle becomes an ellipse.
 */

export interface SeriesPoint {
  day: string;
  views: number;
  partnerClicks: number;
  bookings: number;
  commissionJpy: number;
}

/** Validated against #ffffff — see the dataviz palette checks. */
const PANELS = [
  { key: "views", label: "閲覧", colour: "#7c4dff", format: (n: number) => n.toLocaleString() },
  { key: "partnerClicks", label: "送客", colour: "#eb6834", format: (n: number) => n.toLocaleString() },
  { key: "bookings", label: "予約・注文", colour: "#1baf7a", format: (n: number) => n.toLocaleString() },
  {
    key: "commissionJpy",
    label: "手数料",
    colour: "#eda100",
    format: (n: number) => `¥${n.toLocaleString()}`,
  },
] as const;

const W = 720;
const H = 52;
const PAD = 2;

export function RevenueSparkline({ series }: { series: SeriesPoint[] }) {
  if (series.length < 2) {
    return <p className="text-sm text-ink-soft">推移を描くにはデータが足りません。</p>;
  }

  const step = (W - PAD * 2) / (series.length - 1);
  const short = (day: string) => day.slice(5).replace("-", "/");

  return (
    <div className="space-y-4">
      {PANELS.map((panel) => {
        const values = series.map((point) => point[panel.key]);
        const max = Math.max(...values);
        const total = values.reduce((sum, v) => sum + v, 0);
        const x = (i: number) => PAD + i * step;
        // A flat zero series sits on the baseline rather than filling the panel.
        const y = (v: number) => (max === 0 ? H - PAD : H - PAD - (v / max) * (H - PAD * 2));

        const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
        const area = `${line} L${x(values.length - 1)},${H} L${x(0)},${H} Z`;
        const peak = values.indexOf(max);

        return (
          <div key={panel.key}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: panel.colour }}
                />
                {panel.label}
              </p>
              <p className="text-xs text-ink-soft">
                期間合計{" "}
                <span className="font-bold tabular-nums text-ink">{panel.format(total)}</span>
              </p>
            </div>

            <div className="relative mt-1 h-[52px] w-full">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="h-full w-full"
              role="img"
              aria-label={`${panel.label}の日次推移。期間合計 ${panel.format(total)}。`}
            >
              <line
                x1={0}
                y1={H - PAD}
                x2={W}
                y2={H - PAD}
                stroke="#e6e2f0"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <path d={area} fill={panel.colour} fillOpacity={0.12} />
              <path
                d={line}
                fill="none"
                stroke={panel.colour}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Invisible hit strips: a 2px line is far too thin to aim at. */}
              {values.map((v, i) => (
                <rect
                  key={series[i].day}
                  x={x(i) - step / 2}
                  y={0}
                  width={step}
                  height={H}
                  fill="transparent"
                >
                  <title>{`${series[i].day} — ${panel.label} ${panel.format(v)}`}</title>
                </rect>
              ))}
            </svg>
            {max > 0 && (
              <span
                aria-hidden
                className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-paper"
                style={{
                  left: `${(x(peak) / W) * 100}%`,
                  top: `${(y(max) / H) * 100}%`,
                  backgroundColor: panel.colour,
                }}
              />
            )}
            </div>
          </div>
        );
      })}

      <div className="flex justify-between text-[11px] tabular-nums text-ink-soft">
        <span>{short(series[0].day)}</span>
        <span>{short(series[Math.floor(series.length / 2)].day)}</span>
        <span>{short(series[series.length - 1].day)}</span>
      </div>
    </div>
  );
}
