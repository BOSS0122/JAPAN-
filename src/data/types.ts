import type { Locale } from "@/i18n/routing";

/** Every user-facing string in the dataset carries one entry per supported locale. */
export type LocalizedText = Record<Locale, string>;

/** Tourist spot / bookable experience / restaurant all share one model, split by `category`. */
export type PlaceCategory = "spot" | "experience" | "restaurant";

export type CrowdLevel = "quiet" | "normal" | "busy";

export type Season = "spring" | "summer" | "autumn" | "winter";

export type Weather = "sunny" | "cloudy" | "rain" | "snow";

export const INTEREST_TAGS = [
  "anime",
  "craft",
  "daytrip",
  "family",
  "history",
  "nature",
  "foodie",
  "photogenic",
  "onsen",
  "nightlife",
  "offbeat",
  "shopping",
] as const;

export type InterestTag = (typeof INTEREST_TAGS)[number];

/** Shown when a place has no photograph yet — a half-finished entry should
 *  still look deliberate rather than broken. */
export interface PlaceImage {
  emoji: string;
  from: string;
  to: string;
}

export interface PlacePhoto {
  id: string;
  url: string;
  /** In the default locale. Required — travel content is mostly photographs. */
  alt: string;
  credit: string;
  creditUrl?: string;
}

export interface Place {
  id: string;
  category: PlaceCategory;
  name: LocalizedText;
  description: LocalizedText;
  /** City / district shown in the UI and used to group a multi-day course. */
  area: LocalizedText;
  areaKey: string;
  prefecture: string;
  /** false = the "minor spot" long tail this service exists to surface. */
  famous: boolean;
  tags: InterestTag[];
  lat: number;
  lng: number;
  /** Typical time on site, in minutes. Drives the course planner. */
  stayMinutes: number;
  crowd: CrowdLevel;
  /** 0-5 per season; >=4 promotes the place in the seasonal rail. */
  seasonScore: Record<Season, number>;
  indoor: boolean;
  /** Step-free / stroller friendly — used by the low-stamina route option. */
  accessible: boolean;
  /** Fallback artwork, used when `photos` is empty. */
  image: PlaceImage;
  /** Ordered; the first is the hero on cards and at the top of the detail page. */
  photos: PlacePhoto[];
  /** JPY. Experiences and restaurants only. */
  priceFrom?: number;
  /** true = booked inside the site; false = handed off to an external partner. */
  bookable: boolean;
  externalBookingUrl?: string;
  /** Local opening window in 24h hours, used when sequencing a day. */
  openHour: number;
  closeHour: number;
  /** Restaurants only: which meal slot the planner should drop it into. */
  mealSlot?: "lunch" | "dinner" | "any";
}
