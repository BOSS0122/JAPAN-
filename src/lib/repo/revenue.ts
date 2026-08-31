import "server-only";
import { prisma } from "@/lib/db";

/**
 * Revenue: the arithmetic in one place, and the daily rollup everything reads.
 *
 * Commission rates are stored on the record they apply to and frozen onto each
 * transaction, so renegotiating a rate never rewrites what was already earned.
 */

/** JST, because a Japanese partner's "today" is the one on the invoice. */
export function jstDay(date = new Date()): string {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function commissionOn(grossJpy: number, pct: number): number {
  const rate = Math.min(100, Math.max(0, pct));
  return Math.round((grossJpy * rate) / 100);
}

type StatDelta = Partial<
  Pick<
    { views: number; partnerClicks: number; bookings: number; orders: number; grossJpy: number; commissionJpy: number },
    "views" | "partnerClicks" | "bookings" | "orders" | "grossJpy" | "commissionJpy"
  >
>;

/**
 * Adds to today's row for a place, creating it if this is the day's first
 * event. Deliberately fire-and-forget at the call sites: a failed counter must
 * never fail a booking.
 */
export async function bumpPlaceStat(placeSlug: string, delta: StatDelta): Promise<void> {
  const day = jstDay();
  const zero = {
    views: 0,
    partnerClicks: 0,
    bookings: 0,
    orders: 0,
    grossJpy: 0,
    commissionJpy: 0,
  };
  try {
    await prisma.placeDailyStat.upsert({
      where: { placeSlug_day: { placeSlug, day } },
      create: { placeSlug, day, ...zero, ...delta },
      update: Object.fromEntries(
        Object.entries(delta).map(([key, value]) => [key, { increment: value }]),
      ),
    });
  } catch {
    // Counting is not the transaction. Losing a tick beats losing a booking.
  }
}

export interface RevenueTotals {
  bookingGrossJpy: number;
  bookingCommissionJpy: number;
  orderGrossJpy: number;
  orderCommissionJpy: number;
  partnerClicks: number;
  /** Forecast only — a click is not a sale. */
  partnerPipelineJpy: number;
  /**
   * Of the commission above, the part on transactions where money actually
   * moved. Anything taken while no payment provider was configured is a demo
   * record, and reporting it as earnings would be reporting a number nobody
   * can be paid.
   */
  collectedCommissionJpy: number;
  uncollectedCount: number;
}

/** Windows are expressed in days and resolved here — a page component asking
 *  the clock what time it is makes the render impure. */
export function windowStart(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function windowStartDay(days: number): string {
  return jstDay(windowStart(days));
}

export async function revenueSince(since: Date): Promise<RevenueTotals> {
  const paid = { paymentStatus: "paid" };
  const [bookings, orders, clicks, paidBookings, paidOrders, unpaidBookings, unpaidOrders] =
    await Promise.all([
      prisma.booking.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { totalJpy: true, commissionJpy: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { totalJpy: true, commissionJpy: true },
      }),
      prisma.partnerClick.aggregate({
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        _sum: { estimatedValueJpy: true },
      }),
      prisma.booking.aggregate({
        where: { createdAt: { gte: since }, ...paid },
        _sum: { commissionJpy: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: since }, ...paid },
        _sum: { commissionJpy: true },
      }),
      prisma.booking.count({ where: { createdAt: { gte: since }, paymentStatus: "uncollected" } }),
      prisma.order.count({ where: { createdAt: { gte: since }, paymentStatus: "uncollected" } }),
    ]);

  return {
    bookingGrossJpy: bookings._sum.totalJpy ?? 0,
    bookingCommissionJpy: bookings._sum.commissionJpy ?? 0,
    orderGrossJpy: orders._sum.totalJpy ?? 0,
    orderCommissionJpy: orders._sum.commissionJpy ?? 0,
    partnerClicks: clicks._count._all,
    partnerPipelineJpy: clicks._sum.estimatedValueJpy ?? 0,
    collectedCommissionJpy:
      (paidBookings._sum.commissionJpy ?? 0) + (paidOrders._sum.commissionJpy ?? 0),
    uncollectedCount: unpaidBookings + unpaidOrders,
  };
}

/** Which partners we actually sent traffic to, worst-to-best decided by caller. */
export async function partnerBreakdown(since: Date) {
  const rows = await prisma.partnerClick.groupBy({
    by: ["partnerId", "partnerName", "surface"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    _sum: { estimatedValueJpy: true },
  });
  return rows
    .map((row) => ({
      partnerId: row.partnerId,
      partnerName: row.partnerName,
      surface: row.surface,
      clicks: row._count._all,
      pipelineJpy: row._sum.estimatedValueJpy ?? 0,
    }))
    .sort((a, b) => b.pipelineJpy - a.pipelineJpy || b.clicks - a.clicks);
}

/**
 * View → hand-off → booking, per place. Where the money leaks: a place with
 * many views and no bookings is either mispriced, unbookable, or badly written.
 */
export async function placeFunnel(since: string, limit = 20) {
  const rows = await prisma.placeDailyStat.groupBy({
    by: ["placeSlug"],
    where: { day: { gte: since } },
    _sum: {
      views: true,
      partnerClicks: true,
      bookings: true,
      orders: true,
      grossJpy: true,
      commissionJpy: true,
    },
  });

  return rows
    .map((row) => ({
      placeSlug: row.placeSlug,
      views: row._sum.views ?? 0,
      partnerClicks: row._sum.partnerClicks ?? 0,
      bookings: row._sum.bookings ?? 0,
      orders: row._sum.orders ?? 0,
      grossJpy: row._sum.grossJpy ?? 0,
      commissionJpy: row._sum.commissionJpy ?? 0,
    }))
    .sort((a, b) => b.commissionJpy - a.commissionJpy || b.views - a.views)
    .slice(0, limit);
}

/**
 * Daily series for a chart. Sparse days are filled so a gap reads as zero.
 *
 * Hand-offs come from the click table rather than the per-place rollup: a
 * flight or hotel search belongs to no one place, so counting them per place
 * would show a zero next to a headline that says four.
 */
export async function dailySeries(days = 28) {
  const from = jstDay(windowStart(days));
  const [stats, clicks] = await Promise.all([
    prisma.placeDailyStat.groupBy({
      by: ["day"],
      where: { day: { gte: from } },
      _sum: { views: true, bookings: true, orders: true, commissionJpy: true },
    }),
    prisma.partnerClick.groupBy({
      by: ["day"],
      where: { day: { gte: from } },
      _count: { _all: true },
    }),
  ]);

  const statByDay = new Map(stats.map((r) => [r.day, r]));
  const clickByDay = new Map(clicks.map((r) => [r.day, r._count._all]));

  return Array.from({ length: days }, (_, i) => {
    const day = jstDay(new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000));
    const row = statByDay.get(day);
    return {
      day,
      views: row?._sum.views ?? 0,
      partnerClicks: clickByDay.get(day) ?? 0,
      bookings: (row?._sum.bookings ?? 0) + (row?._sum.orders ?? 0),
      commissionJpy: row?._sum.commissionJpy ?? 0,
    };
  });
}

/** True once there is enough real traffic to stop showing sample numbers. */
export async function hasRealTraffic(): Promise<boolean> {
  return (await prisma.placeDailyStat.count()) > 0;
}

/**
 * Rollups for the partner-facing console.
 *
 * Stats are keyed by place slug, so grouping by area or category means joining
 * against the catalogue. Both dimensions are small, so the join happens here in
 * one pass rather than being denormalised onto every daily row — a place that
 * moves category should not rewrite its history.
 */
async function statsWithPlace(sinceDay: string) {
  const stats = await prisma.placeDailyStat.groupBy({
    by: ["placeSlug"],
    where: { day: { gte: sinceDay } },
    _sum: { views: true, partnerClicks: true, bookings: true, orders: true, commissionJpy: true },
  });
  if (stats.length === 0) return [];

  const places = await prisma.place.findMany({
    where: { slug: { in: stats.map((s) => s.placeSlug) } },
    select: {
      slug: true,
      areaKey: true,
      prefecture: true,
      category: true,
      famous: true,
      translations: { select: { locale: true, area: true, name: true } },
    },
  });
  const bySlug = new Map(places.map((p) => [p.slug, p]));

  return stats.flatMap((stat) => {
    const place = bySlug.get(stat.placeSlug);
    if (!place) return []; // Deleted place; its history stays but has no home.
    return [
      {
        place,
        views: stat._sum.views ?? 0,
        partnerClicks: stat._sum.partnerClicks ?? 0,
        bookings: (stat._sum.bookings ?? 0) + (stat._sum.orders ?? 0),
        commissionJpy: stat._sum.commissionJpy ?? 0,
      },
    ];
  });
}

export interface AreaRollup {
  areaKey: string;
  areaLabel: string;
  prefecture: string;
  views: number;
  referrals: number;
  bookings: number;
  /** Share of views that went to places not marked famous. */
  hiddenGemShare: number;
}

export async function areaRollup(sinceDay: string, locale = "ja"): Promise<AreaRollup[]> {
  const rows = await statsWithPlace(sinceDay);
  const byArea = new Map<string, AreaRollup & { hiddenViews: number }>();

  for (const row of rows) {
    const label =
      row.place.translations.find((t) => t.locale === locale)?.area ?? row.place.areaKey;
    const current = byArea.get(row.place.areaKey) ?? {
      areaKey: row.place.areaKey,
      areaLabel: label,
      prefecture: row.place.prefecture,
      views: 0,
      referrals: 0,
      bookings: 0,
      hiddenGemShare: 0,
      hiddenViews: 0,
    };
    current.views += row.views;
    current.referrals += row.partnerClicks;
    current.bookings += row.bookings;
    if (!row.place.famous) current.hiddenViews += row.views;
    byArea.set(row.place.areaKey, current);
  }

  return [...byArea.values()]
    .map(({ hiddenViews, ...area }) => ({
      ...area,
      hiddenGemShare: area.views === 0 ? 0 : Math.round((hiddenViews / area.views) * 100),
    }))
    .sort((a, b) => b.views - a.views);
}

export async function categoryRollup(sinceDay: string) {
  const rows = await statsWithPlace(sinceDay);
  const byCategory = new Map<string, number>();
  for (const row of rows) {
    byCategory.set(row.place.category, (byCategory.get(row.place.category) ?? 0) + row.views);
  }
  return [...byCategory.entries()].map(([category, views]) => ({ category, views }));
}
