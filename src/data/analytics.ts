import { places } from "./places";

/**
 * Deterministic sample analytics for the municipality-facing console.
 * Replace with the real events pipeline before this ships to a partner.
 */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export interface AreaRow {
  areaKey: string;
  areaLabel: string;
  prefecture: string;
  views: number;
  referrals: number;
  bookings: number;
  hiddenGemShare: number;
}

export const areaRows: AreaRow[] = [
  ...new Map(places.map((p) => [p.areaKey, p])).values(),
]
  .map((sample) => {
    const inArea = places.filter((p) => p.areaKey === sample.areaKey);
    const seed = hash(sample.areaKey);
    const views = Math.round(2400 + seed * 34000 + inArea.length * 900);
    const referrals = Math.round(views * (0.06 + seed * 0.05));
    return {
      areaKey: sample.areaKey,
      areaLabel: sample.area.en,
      prefecture: sample.prefecture,
      views,
      referrals,
      bookings: Math.round(referrals * (0.22 + seed * 0.18)),
      hiddenGemShare: Math.round(
        (inArea.filter((p) => !p.famous).length / inArea.length) * 100,
      ),
    };
  })
  .sort((a, b) => b.views - a.views);

export const weeklyTrend = Array.from({ length: 12 }, (_, i) => {
  const seed = hash(`week-${i}`);
  const base = 8200 + i * 640;
  return {
    week: `W${i + 1}`,
    views: Math.round(base + seed * 3400),
    referrals: Math.round((base + seed * 3400) * (0.07 + seed * 0.03)),
    bookings: Math.round((base + seed * 3400) * (0.019 + seed * 0.01)),
  };
});

export const categorySplit = (["spot", "experience", "restaurant"] as const).map(
  (category) => {
    const inCategory = places.filter((p) => p.category === category);
    const views = inCategory.reduce(
      (sum, p) => sum + Math.round(900 + hash(p.id) * 7200),
      0,
    );
    return { category, views };
  },
);

export const topPlaces = places
  .map((p) => ({
    id: p.id,
    name: p.name.en,
    area: p.area.en,
    category: p.category,
    famous: p.famous,
    views: Math.round(900 + hash(p.id) * 7200),
    bookings: Math.round((900 + hash(p.id) * 7200) * (0.02 + hash(p.id + "b") * 0.04)),
  }))
  .sort((a, b) => b.views - a.views)
  .slice(0, 10);

export const totals = {
  views: areaRows.reduce((s, r) => s + r.views, 0),
  referrals: areaRows.reduce((s, r) => s + r.referrals, 0),
  bookings: areaRows.reduce((s, r) => s + r.bookings, 0),
  areas: areaRows.length,
};
