import type { ReactNode } from "react";
import type { CrowdLevel, PlaceCategory } from "@/data/types";

export const CATEGORY_STYLE: Record<
  PlaceCategory,
  { chip: string; dot: string; emoji: string }
> = {
  spot: { chip: "bg-grape-soft text-grape", dot: "bg-grape", emoji: "⛩️" },
  experience: { chip: "bg-lagoon-soft text-lagoon", dot: "bg-lagoon", emoji: "🎨" },
  restaurant: { chip: "bg-tangerine-soft text-tangerine", dot: "bg-tangerine", emoji: "🍜" },
};

export const CROWD_STYLE: Record<CrowdLevel, { chip: string; bars: number }> = {
  quiet: { chip: "bg-matcha-soft text-matcha", bars: 1 },
  normal: { chip: "bg-sunshine-soft text-[#8a5b00]", bars: 2 },
  busy: { chip: "bg-berry-soft text-berry", bars: 3 },
};

export function CrowdMeter({ level, label }: { level: CrowdLevel; label: string }) {
  const { chip, bars } = CROWD_STYLE[level];
  return (
    <span className={`jq-chip ${chip}`}>
      <span aria-hidden className="flex items-end gap-[2px]">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`w-[3px] rounded-full ${n <= bars ? "bg-current" : "bg-current/25"}`}
            style={{ height: `${3 + n * 2}px` }}
          />
        ))}
      </span>
      {label}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-berry">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
          {title}
        </h2>
        {sub && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-sunshine-soft px-3 py-2 text-xs font-medium text-[#7a5200]">
      <span aria-hidden>⚠️</span>
      <span>{children}</span>
    </p>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-3xl font-extrabold text-ink">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
    </div>
  );
}
