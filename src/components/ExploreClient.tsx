"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { places } from "@/data/places";
import { INTEREST_TAGS, type InterestTag, type PlaceCategory, type Season, type Weather } from "@/data/types";
import { t as localized } from "@/lib/localized";
import { relevanceScore } from "@/lib/season";
import { PlaceCard } from "./PlaceCard";
import { useShortlist } from "./shortlist";
import { SectionHeading } from "./ui";

type Fame = "any" | "famous" | "hidden";
type Sort = "recommended" | "duration" | "price";

const CATEGORIES: PlaceCategory[] = ["spot", "experience", "restaurant"];

export function ExploreClient({
  season,
  weather,
}: {
  season: Season;
  weather: Weather;
}) {
  const locale = useLocale();
  const t = useTranslations("explore");
  const tc = useTranslations("categories");
  const tt = useTranslations("tags");
  const tcommon = useTranslations("common");
  const { ids, ready } = useShortlist();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [tags, setTags] = useState<InterestTag[]>([]);
  const [area, setArea] = useState("all");
  const [fame, setFame] = useState<Fame>("any");
  const [sort, setSort] = useState<Sort>("recommended");

  const areaOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of places) {
      if (!seen.has(p.areaKey)) seen.set(p.areaKey, localized(p.area, locale));
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [locale]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = places.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (area !== "all" && p.areaKey !== area) return false;
      if (fame === "famous" && !p.famous) return false;
      if (fame === "hidden" && p.famous) return false;
      if (tags.length > 0 && !tags.every((tag) => p.tags.includes(tag))) return false;
      if (q) {
        const haystack = [
          localized(p.name, locale),
          localized(p.description, locale),
          localized(p.area, locale),
          p.prefecture,
          ...p.tags.map((tag) => tt(tag)),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === "duration") return a.stayMinutes - b.stayMinutes;
      if (sort === "price") return (a.priceFrom ?? 0) - (b.priceFrom ?? 0);
      return (
        relevanceScore(b, season, weather) - relevanceScore(a, season, weather)
      );
    });
  }, [query, category, area, fame, tags, sort, locale, season, weather, tt]);

  const activeFilters =
    (category !== "all" ? 1 : 0) +
    (area !== "all" ? 1 : 0) +
    (fame !== "any" ? 1 : 0) +
    tags.length +
    (query ? 1 : 0);

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("title")}
        sub={t("subtitle", { count: places.length })}
      />

      <div className="jq-card space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="jq-label" htmlFor="q">
              {tcommon("search")}
            </label>
            <input
              id="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="jq-field"
            />
          </div>
          <div>
            <label className="jq-label" htmlFor="area">
              {t("area")}
            </label>
            <select
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="jq-field"
            >
              <option value="all">{t("allAreas")}</option>
              {areaOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="jq-label" htmlFor="sort">
              {t("sort")}
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="jq-field"
            >
              <option value="recommended">{t("sortRecommended")}</option>
              <option value="duration">{t("sortDuration")}</option>
              <option value="price">{t("sortPrice")}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="jq-label mb-0">{t("category")}</span>
          <FilterPill active={category === "all"} onClick={() => setCategory("all")}>
            {t("allCategories")}
          </FilterPill>
          {CATEGORIES.map((c) => (
            <FilterPill key={c} active={category === c} onClick={() => setCategory(c)}>
              {tc(`${c}Plural`)}
            </FilterPill>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="jq-label mb-0">{t("famousFilter")}</span>
          {(["any", "famous", "hidden"] as Fame[]).map((f) => (
            <FilterPill key={f} active={fame === f} onClick={() => setFame(f)}>
              {f === "any" ? t("anyFame") : f === "famous" ? t("famousOnly") : t("hiddenOnly")}
            </FilterPill>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="jq-label mb-0">{t("interests")}</span>
          {INTEREST_TAGS.map((tag) => (
            <FilterPill
              key={tag}
              active={tags.includes(tag)}
              onClick={() =>
                setTags((prev) =>
                  prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag],
                )
              }
            >
              #{tt(tag)}
            </FilterPill>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-3">
          <p className="text-sm font-bold text-ink">
            {tcommon("results", { count: results.length })}
          </p>
          {activeFilters > 0 && (
            <button
              type="button"
              className="text-sm font-bold text-berry hover:underline"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setTags([]);
                setArea("all");
                setFame("any");
              }}
            >
              {tcommon("clear")} ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <p className="jq-card p-8 text-center text-sm text-ink-soft">{t("empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}

      {ready && ids.length > 0 && (
        <div className="sticky bottom-4 z-30 mx-auto w-fit">
          <Link
            href="/plan"
            className="jq-btn jq-btn-primary shadow-lg shadow-ink/20"
          >
            <span aria-hidden>🧳</span>
            {t("shortlistCount", { count: ids.length })} · {t("buildCourse")} →
          </Link>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`jq-chip border-2 transition ${
        active
          ? "border-grape bg-grape text-white"
          : "border-line bg-paper text-ink-soft hover:border-grape hover:text-grape"
      }`}
    >
      {children}
    </button>
  );
}
