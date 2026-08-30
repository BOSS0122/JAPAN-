import type { Place } from "@/data/types";

export interface BadgeDefinition {
  key: string;
  emoji: string;
  target: number;
  progress: (visited: Place[]) => number;
}

export const BADGES: BadgeDefinition[] = [
  {
    key: "firstStep",
    emoji: "👣",
    target: 1,
    progress: (visited) => visited.length,
  },
  {
    key: "backstreets",
    emoji: "🔦",
    target: 3,
    progress: (visited) => visited.filter((p) => !p.famous).length,
  },
  {
    key: "craftsman",
    emoji: "🪡",
    target: 2,
    progress: (visited) => visited.filter((p) => p.tags.includes("craft")).length,
  },
  {
    key: "gourmand",
    emoji: "🍥",
    target: 3,
    progress: (visited) => visited.filter((p) => p.category === "restaurant").length,
  },
  {
    key: "voyager",
    emoji: "🗾",
    target: 4,
    progress: (visited) => new Set(visited.map((p) => p.areaKey)).size,
  },
];

/** Hidden gems are worth more — the whole point of the rally. */
export function stampValue(place: Place): number {
  return place.famous ? 1 : 2;
}
