"use client";

import { useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { INTEREST_TAGS, type InterestTag, type PlaceCategory } from "@/data/types";
import {
  activeFilterCount,
  EMPTY_QUERY,
  placeQueryToHref,
  type Fame,
  type PlaceQuery,
  type PlaceSort,
} from "@/lib/place-query";

/**
 * Controls only. The results are rendered by the server page; every change here
 * rewrites the URL and lets the server re-run the search. `replace` rather than
 * `push` keeps one Back press from unwinding twenty filter taps.
 */

const CATEGORIES: PlaceCategory[] = ["spot", "experience", "restaurant"];

export function ExploreFilters({
  query,
  areaOptions,
  resultCount,
}: {
  query: PlaceQuery;
  areaOptions: { key: string; label: string; count: number }[];
  resultCount: number;
}) {
  const t = useTranslations("explore");
  const tc = useTranslations("categories");
  const tt = useTranslations("tags");
  const tcommon = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Any filter change returns to page 1 — page 3 of the old result set is meaningless. */
  function go(patch: Partial<PlaceQuery>) {
    const next = { ...query, page: 1, ...patch };
    startTransition(() => router.replace(placeQueryToHref(next), { scroll: false }));
  }

  function onType(value: string) {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => go({ q: value.trim() }), 300);
  }

  const active = activeFilterCount(query);

  return (
    <div className="jq-card space-y-4 p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="jq-label" htmlFor="q">
            {tcommon("search")}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            // Remounts when the server value changes (e.g. "clear all"), which
            // keeps an uncontrolled field honest without a sync effect.
            key={query.q}
            defaultValue={query.q}
            onChange={(e) => onType(e.target.value)}
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
            className="jq-field"
            value={query.area}
            onChange={(e) => go({ area: e.target.value })}
          >
            <option value="all">{t("allAreas")}</option>
            {areaOptions.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label} ({a.count})
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
            className="jq-field"
            value={query.sort}
            onChange={(e) => go({ sort: e.target.value as PlaceSort })}
          >
            <option value="recommended">{t("sortRecommended")}</option>
            <option value="duration">{t("sortDuration")}</option>
            <option value="price">{t("sortPrice")}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="jq-label mb-0">{t("category")}</span>
        <FilterPill active={query.category === "all"} onClick={() => go({ category: "all" })}>
          {t("allCategories")}
        </FilterPill>
        {CATEGORIES.map((c) => (
          <FilterPill key={c} active={query.category === c} onClick={() => go({ category: c })}>
            {tc(`${c}Plural`)}
          </FilterPill>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="jq-label mb-0">{t("famousFilter")}</span>
        {(["any", "famous", "hidden"] as Fame[]).map((f) => (
          <FilterPill key={f} active={query.fame === f} onClick={() => go({ fame: f })}>
            {f === "any" ? t("anyFame") : f === "famous" ? t("famousOnly") : t("hiddenOnly")}
          </FilterPill>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="jq-label mb-0">{t("interests")}</span>
        {INTEREST_TAGS.map((tag) => (
          <FilterPill
            key={tag}
            active={query.tags.includes(tag)}
            onClick={() =>
              go({
                tags: query.tags.includes(tag)
                  ? query.tags.filter((x) => x !== tag)
                  : ([...query.tags, tag] as InterestTag[]),
              })
            }
          >
            #{tt(tag)}
          </FilterPill>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <p className="text-sm font-bold text-ink" aria-live="polite">
          {pending ? tcommon("loading") : tcommon("results", { count: resultCount })}
        </p>
        {active > 0 && (
          <button
            type="button"
            className="text-sm font-bold text-berry hover:underline"
            onClick={() =>
              startTransition(() =>
                router.replace(placeQueryToHref({ ...EMPTY_QUERY, sort: query.sort }), {
                  scroll: false,
                }),
              )
            }
          >
            {tcommon("clear")} ({active})
          </button>
        )}
      </div>
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
