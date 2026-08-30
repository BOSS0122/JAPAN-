import type { Place } from "@/data/types";
import { getPlaces } from "@/data/places";
import { haversineKm } from "./geo";

export type StaminaLevel = "relaxed" | "standard" | "active";

export interface PlanOptions {
  placeIds: string[];
  days: number;
  stamina: StaminaLevel;
  /** Step-free routing for travellers with strollers or older companions. */
  accessibleOnly: boolean;
  /** Set by the "re-plan for bad weather" action: prefers indoor stops. */
  preferIndoor: boolean;
  startHour: number;
}

export interface CourseStop {
  place: Place;
  /** Minutes past midnight, local time. */
  arrive: number;
  depart: number;
  travelMinutes: number;
  travelKm: number;
  mode: "start" | "walk" | "transit";
}

export interface CourseDay {
  day: number;
  areaKey: string;
  stops: CourseStop[];
  walkKm: number;
  transitKm: number;
  endMinutes: number;
}

export interface DroppedPlace {
  place: Place;
  reason: "accessibility" | "weather" | "no-time";
}

export interface Course {
  days: CourseDay[];
  dropped: DroppedPlace[];
  options: PlanOptions;
  totalWalkKm: number;
}

const PROFILE: Record<
  StaminaLevel,
  { walkKmh: number; maxWalkKm: number; dayMinutes: number; bufferMin: number }
> = {
  relaxed: { walkKmh: 3.4, maxWalkKm: 1.1, dayMinutes: 420, bufferMin: 20 },
  standard: { walkKmh: 4.4, maxWalkKm: 2.2, dayMinutes: 540, bufferMin: 10 },
  active: { walkKmh: 5.2, maxWalkKm: 3.5, dayMinutes: 660, bufferMin: 5 },
};

/** Transit stands in for train + walk to/from the station. */
const TRANSIT_KMH = 24;
const TRANSIT_OVERHEAD_MIN = 9;

function leg(from: Place, to: Place, stamina: StaminaLevel) {
  const km = haversineKm(from, to);
  const p = PROFILE[stamina];
  if (km <= p.maxWalkKm) {
    return {
      km,
      minutes: Math.max(3, Math.round((km / p.walkKmh) * 60)) + p.bufferMin,
      mode: "walk" as const,
    };
  }
  return {
    km,
    minutes: Math.round((km / TRANSIT_KMH) * 60) + TRANSIT_OVERHEAD_MIN + p.bufferMin,
    mode: "transit" as const,
  };
}

function mealPreference(place: Place, clockMinutes: number): number {
  if (place.category !== "restaurant") return 0;
  const hour = clockMinutes / 60;
  const slot = place.mealSlot ?? "any";
  const lunchWindow = hour >= 11.5 && hour <= 14;
  const dinnerWindow = hour >= 17.5 && hour <= 21;
  if (slot === "lunch") return lunchWindow ? -25 : 40;
  if (slot === "dinner") return dinnerWindow ? -25 : 40;
  return lunchWindow || dinnerWindow ? -15 : 15;
}

/**
 * Greedy nearest-neighbour with three corrections: opening hours, meal slots,
 * and (when re-planning for weather) a bias toward indoor stops.
 */
function planDay(
  pool: Place[],
  opts: PlanOptions,
  dayNumber: number,
): { day: CourseDay; leftover: Place[] } {
  const profile = PROFILE[opts.stamina];
  const dayStart = opts.startHour * 60;
  const dayEnd = dayStart + profile.dayMinutes;

  const remaining = [...pool];
  const stops: CourseStop[] = [];
  let clock = dayStart;
  let walkKm = 0;
  let transitKm = 0;
  let current: Place | null = null;

  while (remaining.length > 0) {
    let bestIndex = -1;
    let bestCost = Infinity;
    let bestLeg = { km: 0, minutes: 0, mode: "start" as CourseStop["mode"] };

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const l = current
        ? leg(current, candidate, opts.stamina)
        : { km: 0, minutes: 0, mode: "start" as const };

      let arrive = clock + l.minutes;
      // Wait for opening rather than discarding an early-clock candidate.
      const opens = candidate.openHour * 60;
      const closes = candidate.closeHour * 60;
      if (arrive < opens) arrive = opens;
      if (arrive + candidate.stayMinutes > Math.min(closes, dayEnd)) continue;

      let cost = l.minutes + (arrive - (clock + l.minutes)) * 0.5;
      cost += mealPreference(candidate, arrive);
      if (opts.preferIndoor && !candidate.indoor) cost += 45;

      if (cost < bestCost) {
        bestCost = cost;
        bestIndex = i;
        bestLeg = l;
      }
    }

    if (bestIndex === -1) break;

    const place = remaining.splice(bestIndex, 1)[0];
    const arrive = Math.max(clock + bestLeg.minutes, place.openHour * 60);
    const depart = arrive + place.stayMinutes;

    stops.push({
      place,
      arrive,
      depart,
      travelMinutes: bestLeg.minutes,
      travelKm: Number(bestLeg.km.toFixed(2)),
      mode: bestLeg.mode,
    });

    if (bestLeg.mode === "walk") walkKm += bestLeg.km;
    if (bestLeg.mode === "transit") transitKm += bestLeg.km;

    clock = depart;
    current = place;
  }

  return {
    day: {
      day: dayNumber,
      areaKey: stops[0]?.place.areaKey ?? "",
      stops,
      walkKm: Number(walkKm.toFixed(2)),
      transitKm: Number(transitKm.toFixed(2)),
      endMinutes: clock,
    },
    leftover: remaining,
  };
}

export function planCourse(opts: PlanOptions): Course {
  const selected = getPlaces(opts.placeIds);
  const dropped: DroppedPlace[] = [];

  const eligible = selected.filter((p) => {
    if (opts.accessibleOnly && !p.accessible) {
      dropped.push({ place: p, reason: "accessibility" });
      return false;
    }
    return true;
  });

  // Group by area so a multi-day trip does not zig-zag across the country.
  const byArea = new Map<string, Place[]>();
  for (const p of eligible) {
    const list = byArea.get(p.areaKey) ?? [];
    list.push(p);
    byArea.set(p.areaKey, list);
  }
  const groups = [...byArea.values()].sort((a, b) => b.length - a.length);

  const days: CourseDay[] = [];
  const queue = [...groups];

  while (queue.length > 0 && days.length < opts.days) {
    const group = queue.shift()!;
    const { day, leftover } = planDay(group, opts, days.length + 1);
    if (day.stops.length === 0) {
      // Nothing fit — usually opening hours; report rather than loop forever.
      leftover.forEach((p) => dropped.push({ place: p, reason: "no-time" }));
      continue;
    }
    days.push(day);
    if (leftover.length > 0) queue.unshift(leftover);
  }

  for (const group of queue) {
    for (const p of group) dropped.push({ place: p, reason: "no-time" });
  }

  return {
    days,
    dropped,
    options: opts,
    totalWalkKm: Number(days.reduce((s, d) => s + d.walkKm, 0).toFixed(2)),
  };
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
