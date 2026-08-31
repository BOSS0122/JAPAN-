import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { INTEREST_TAGS, type InterestTag } from "@/data/types";
import { currentSeason, getWeather } from "@/lib/season";
import {
  countPlaces,
  listAreaOptions,
  listPlacesForMood,
  searchPlaces,
} from "@/lib/repo/places";
import { moodSearch } from "@/lib/repo/mood";
import { enforce, LIMITS } from "@/lib/rate-limit";
import { getTravellerId } from "@/lib/session";
import {
  PLACE_PAGE_SIZE,
  parsePlaceQuery,
  placeQueryToHref,
  type PlaceQuery,
} from "@/lib/place-query";
import { moodSearchIsSemantic } from "@/lib/providers";
import { ExploreFilters } from "@/components/ExploreFilters";
import { PlaceCard } from "@/components/PlaceCard";
import { ShortlistBar } from "@/components/ShortlistBar";
import { SectionHeading } from "@/components/ui";
import { localeAlternates } from "@/lib/seo";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "explore" });
  return { title: t("title"), alternates: localeAlternates(locale, "/explore") };
}

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const [{ locale }, rawSearch] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const query = parsePlaceQuery(rawSearch);
  const t = await getTranslations({ locale, namespace: "explore" });
  const tt = await getTranslations({ locale, namespace: "tags" });

  // "temple" should find the #temples tag as well as the word in a description.
  // Tag labels are messages, so the match is resolved here and handed down.
  const needle = query.q.toLowerCase();
  const tagMatches: InterestTag[] = needle
    ? INTEREST_TAGS.filter((tag) => tt(tag).toLowerCase().includes(needle))
    : [];

  // A mood replaces the ranking, not the filters: they decide what it may
  // choose from, so "京都で静かなところ" narrows before the search runs.
  const mood = query.mood
    ? await runMoodSearch(query, tagMatches, locale)
    : null;

  const [result, areaOptions, catalogueTotal] = await Promise.all([
    mood
      ? Promise.resolve({
          places: mood.places,
          total: mood.places.length,
          page: 1,
          pageCount: 1,
        })
      : searchPlaces(query, {
          season: currentSeason(),
          weather: getWeather("tokyo").weather,
          tagMatches,
        }),
    listAreaOptions(locale),
    countPlaces(),
  ]);

  const from = (result.page - 1) * PLACE_PAGE_SIZE + 1;
  const to = Math.min(result.page * PLACE_PAGE_SIZE, result.total);

  return (
    <div className="space-y-6 pb-16">
      <SectionHeading title={t("title")} sub={t("subtitle", { count: catalogueTotal })} />

      <ExploreFilters
        query={query}
        areaOptions={areaOptions}
        resultCount={result.total}
        moodAvailable={moodSearchIsSemantic()}
      />

      {mood && (
        <div className="jq-card space-y-1 p-4">
          <p className="text-sm text-ink-soft">
            {mood.places.length === 0
              ? t("moodEmpty", { mood: query.mood })
              : t("moodFound", { count: mood.places.length, mood: query.mood })}
          </p>
          {!mood.semantic && <p className="text-xs text-ink-mute">{t("moodFallback")}</p>}
        </div>
      )}

      {result.places.length === 0 ? (
        <p className="jq-card p-8 text-center text-sm text-ink-soft">{t("empty")}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                reason={mood?.reasons.get(place.id)}
              />
            ))}
          </div>

          {!mood && result.pageCount > 1 && (
            <nav
              className="flex items-center justify-between gap-3 pt-2"
              aria-label={t("pagination")}
            >
              <PageLink query={query} to={result.page - 1} disabled={result.page <= 1}>
                ← {t("prevPage")}
              </PageLink>
              <p className="text-center text-sm text-ink-soft">
                {t("showing", { from, to, total: result.total })}
                <span className="mx-2 text-line-strong" aria-hidden>
                  ·
                </span>
                {t("pageOf", { page: result.page, pages: result.pageCount })}
              </p>
              <PageLink
                query={query}
                to={result.page + 1}
                disabled={result.page >= result.pageCount}
              >
                {t("nextPage")} →
              </PageLink>
            </nav>
          )}
        </>
      )}

      <ShortlistBar />
    </div>
  );
}

/** Rate-limited separately: each miss is an API call, unlike a filter change. */
async function runMoodSearch(
  query: PlaceQuery,
  tagMatches: InterestTag[],
  locale: string,
) {
  try {
    await enforce("moodSearch", LIMITS.moodSearch, await getTravellerId());
  } catch {
    return null;
  }
  const pool = await listPlacesForMood(query, tagMatches);
  return moodSearch(query.mood, locale, pool);
}

function PageLink({
  query,
  to,
  disabled,
  children,
}: {
  query: PlaceQuery;
  to: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="jq-btn jq-btn-ghost cursor-not-allowed opacity-40" aria-disabled>
        {children}
      </span>
    );
  }
  // A real link, so pages are shareable and open-in-new-tab works.
  return (
    <Link href={placeQueryToHref({ ...query, page: to })} className="jq-btn jq-btn-ghost">
      {children}
    </Link>
  );
}
