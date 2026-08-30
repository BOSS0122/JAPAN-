import { INTEREST_TAGS, type InterestTag, type PlaceCategory } from "@/data/types";

/**
 * The Explore search lives in the URL, not in component state.
 *
 * That is what makes a result shareable, linkable and back-button-correct, and
 * it is also what lets the filtering run in SQL: the server can only narrow a
 * query it can see. This module is the single definition of that URL shape,
 * imported by both the server page that reads it and the client controls that
 * write it, so the two can never drift.
 */

export const PLACE_PAGE_SIZE = 24;

export type Fame = "any" | "famous" | "hidden";
export type PlaceSort = "recommended" | "duration" | "price";

export interface PlaceQuery {
  q: string;
  category: PlaceCategory | "all";
  area: string;
  fame: Fame;
  tags: InterestTag[];
  sort: PlaceSort;
  page: number;
}

export const EMPTY_QUERY: PlaceQuery = {
  q: "",
  category: "all",
  area: "all",
  fame: "any",
  tags: [],
  sort: "recommended",
  page: 1,
};

const CATEGORIES: PlaceCategory[] = ["spot", "experience", "restaurant"];
const FAMES: Fame[] = ["any", "famous", "hidden"];
const SORTS: PlaceSort[] = ["recommended", "duration", "price"];

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Anything unrecognised falls back to the default rather than 404ing. */
export function parsePlaceQuery(
  params: Record<string, string | string[] | undefined>,
): PlaceQuery {
  const category = one(params.cat) as PlaceCategory;
  const fame = one(params.fame) as Fame;
  const sort = one(params.sort) as PlaceSort;
  const page = Number.parseInt(one(params.page), 10);

  return {
    q: one(params.q).trim().slice(0, 80),
    category: CATEGORIES.includes(category) ? category : "all",
    area: one(params.area) || "all",
    fame: FAMES.includes(fame) ? fame : "any",
    tags: one(params.tags)
      .split(",")
      .filter((tag): tag is InterestTag => INTEREST_TAGS.includes(tag as InterestTag)),
    sort: SORTS.includes(sort) ? sort : "recommended",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

/** Defaults are omitted so a plain `/explore` stays a clean URL. */
export function placeQueryToParams(query: PlaceQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category !== "all") params.set("cat", query.category);
  if (query.area !== "all") params.set("area", query.area);
  if (query.fame !== "any") params.set("fame", query.fame);
  if (query.tags.length > 0) params.set("tags", query.tags.join(","));
  if (query.sort !== "recommended") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  return params;
}

export function placeQueryToHref(query: PlaceQuery): string {
  const params = placeQueryToParams(query).toString();
  return params ? `/explore?${params}` : "/explore";
}

/** How many filters the "clear" button would drop. */
export function activeFilterCount(query: PlaceQuery): number {
  return (
    (query.q ? 1 : 0) +
    (query.category !== "all" ? 1 : 0) +
    (query.area !== "all" ? 1 : 0) +
    (query.fame !== "any" ? 1 : 0) +
    query.tags.length
  );
}
