import type { CrowdLevel, Place, Season, Weather } from "@/data/types";

export function currentSeason(date = new Date()): Season {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

/**
 * Stubbed weather feed. A real implementation swaps this for JMA / OpenWeather
 * without touching callers — the shape is all the UI depends on.
 */
export interface WeatherReading {
  weather: Weather;
  tempC: number;
  areaKey: string;
}

const WEATHER_CYCLE: Weather[] = ["sunny", "cloudy", "rain", "sunny", "cloudy", "snow"];

export function getWeather(areaKey: string, date = new Date()): WeatherReading {
  // Deterministic pseudo-weather so server and client render the same thing.
  const seed = areaKey.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + date.getDate();
  const weather = WEATHER_CYCLE[seed % WEATHER_CYCLE.length];
  const season = currentSeason(date);
  const base = { spring: 17, summer: 30, autumn: 19, winter: 6 }[season];
  return { weather, tempC: base + (seed % 5) - 2, areaKey };
}

/**
 * The handful of columns the score actually reads. Declared separately so the
 * database can rank a search without loading whole `Place` objects — a `Place`
 * satisfies it, and so does a five-column projection.
 */
export interface Rankable {
  seasonScore: Record<Season, number>;
  indoor: boolean;
  crowd: CrowdLevel;
  famous: boolean;
}

/**
 * 0-100 relevance used to order the "right now" rail. Season carries the most
 * weight; bad weather pushes indoor places up and outdoor ones down.
 */
export function relevanceScore(
  place: Rankable,
  season: Season,
  weather: Weather,
): number {
  let score = place.seasonScore[season] * 16;

  const wet = weather === "rain" || weather === "snow";
  if (wet) score += place.indoor ? 18 : -22;
  if (weather === "sunny" && !place.indoor) score += 8;

  if (place.crowd === "quiet") score += 6;
  if (place.crowd === "busy") score -= 4;
  if (!place.famous) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Places worth putting in the seasonal rail on the home page. */
export function seasonalPicks(
  all: Place[],
  season: Season,
  weather: Weather,
  limit = 6,
): Place[] {
  return [...all]
    .filter((p) => p.seasonScore[season] >= 4)
    .sort((a, b) => relevanceScore(b, season, weather) - relevanceScore(a, season, weather))
    .slice(0, limit);
}
