import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPlaceBySlug, listPlaces } from "@/lib/repo/places";
import type { Season } from "@/data/types";
import { t as localized } from "@/lib/localized";
import { haversineKm } from "@/lib/geo";
import { currentSeason, getWeather } from "@/lib/season";
import { getTravellerId } from "@/lib/session";
import { listVisits } from "@/lib/store";
import { SERVICE_NAME } from "@/config/site";
import { CATEGORY_STYLE, CrowdMeter, DemoNotice } from "@/components/ui";
import { ShortlistButton } from "@/components/ShortlistButton";
import { CheckInButton } from "@/components/CheckInButton";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceMap } from "@/components/PlaceMap";
import { EtiquetteCards } from "@/components/EtiquetteCards";
import { getEtiquetteFor } from "@/data/etiquette";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const place = await getPlaceBySlug(id);
  if (!place) return {};
  return {
    title: localized(place.name, locale),
    description: localized(place.description, locale),
  };
}

const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

export default async function PlacePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const place = await getPlaceBySlug(id);
  if (!place) notFound();

  const [t, tc, tt, tcrowd, tcommon, tseason, tweather] = await Promise.all([
    getTranslations("place"),
    getTranslations("categories"),
    getTranslations("tags"),
    getTranslations("crowd"),
    getTranslations("common"),
    getTranslations("seasons"),
    getTranslations("weather"),
  ]);

  const travellerId = await getTravellerId();
  const visits = await listVisits(travellerId);
  const visited = visits.some((v) => v.placeId === place.id);

  const weather = getWeather(place.areaKey);
  const season = currentSeason();
  const wet = weather.weather === "rain" || weather.weather === "snow";

  const all = await listPlaces();
  const nearby = all
    .filter((p) => p.id !== place.id)
    .map((p) => ({ p, km: haversineKm(place, p) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3)
    .map((x) => x.p);

  const style = CATEGORY_STYLE[place.category];
  const [hero, ...gallery] = place.photos;

  return (
    <div className="space-y-10">
      <div
        className="jq-card relative overflow-hidden"
        style={
          hero
            ? undefined
            : {
                backgroundImage: `linear-gradient(135deg, ${place.image.from}, ${place.image.to})`,
              }
        }
      >
        {hero && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.url}
              alt={hero.alt}
              className="absolute inset-0 h-full w-full bg-ink object-cover"
            />
            {/* The title sits on the photograph, so it needs its own contrast
                rather than hoping the image is dark where the text lands. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/45 to-ink/20"
            />
          </>
        )}
        <div className="relative flex flex-col items-center gap-2 px-6 py-12 text-center sm:py-20">
          {!hero && (
            <span aria-hidden className="text-7xl drop-shadow">
              {place.image.emoji}
            </span>
          )}
          <h1 className="font-display text-3xl font-extrabold text-white drop-shadow-sm sm:text-4xl">
            {localized(place.name, locale)}
          </h1>
          <p className="font-semibold text-white/90">
            📍 {localized(place.area, locale)} · {place.prefecture}
          </p>
          {hero?.credit && (
            <p className="absolute bottom-2 right-3 text-[11px] text-white/70">
              {hero.creditUrl ? (
                <a
                  href={hero.creditUrl}
                  rel="noopener noreferrer nofollow"
                  target="_blank"
                  className="hover:underline"
                >
                  © {hero.credit}
                </a>
              ) : (
                <>© {hero.credit}</>
              )}
            </p>
          )}
        </div>
      </div>

      {gallery.length > 0 && (
        <section>
          <h2 className="sr-only">{t("photos")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((photo) => (
              <li key={photo.id} className="jq-card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.alt}
                  loading="lazy"
                  className="h-48 w-full bg-cream object-cover"
                />
                {photo.credit && (
                  <p className="px-3 py-2 text-xs text-ink-soft">© {photo.credit}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`jq-chip ${style.chip}`}>
              <span aria-hidden>{style.emoji}</span>
              {tc(place.category)}
            </span>
            <CrowdMeter level={place.crowd} label={`${tcrowd("label")}: ${tcrowd(place.crowd)}`} />
            <span className="jq-chip bg-cream text-ink-soft">
              🕒 {t("openHours", { from: `${place.openHour}:00`, to: `${place.closeHour}:00` })}
            </span>
            <span className="jq-chip bg-cream text-ink-soft">
              {place.indoor ? `🏠 ${t("indoor")}` : `🌤 ${t("outdoor")}`}
            </span>
            <span className="jq-chip bg-cream text-ink-soft">
              {place.accessible ? `♿ ${t("accessible")}` : `🪜 ${t("notAccessible")}`}
            </span>
          </div>

          <section>
            <h2 className="font-display text-xl font-extrabold text-ink">{t("about")}</h2>
            <p className="mt-2 text-base leading-relaxed text-ink-soft">
              {localized(place.description, locale)}
            </p>
          </section>

          {wet && (
            <DemoNotice>{place.indoor ? t("weatherNote") : t("weatherWarn")}</DemoNotice>
          )}

          <section>
            <h2 className="font-display text-xl font-extrabold text-ink">
              {t("bestSeason")}
            </h2>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {SEASONS.map((s) => {
                const score = place.seasonScore[s];
                const now = s === season;
                return (
                  <div
                    key={s}
                    className={`rounded-xl border-2 p-3 text-center ${
                      now ? "border-berry bg-berry-soft" : "border-line bg-paper"
                    }`}
                  >
                    <p className="text-xs font-bold text-ink-soft">{tseason(s)}</p>
                    <p aria-label={`${score} / 5`} className="mt-1 text-sm">
                      {"★".repeat(score)}
                      <span className="text-ink-soft/30">{"★".repeat(5 - score)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              {tweather(weather.weather)} · {weather.tempC}°C
            </p>
          </section>

          <section>
            <div className="flex flex-wrap gap-1.5">
              {place.tags.map((tag) => (
                <Link
                  key={tag}
                  href="/explore"
                  className="jq-chip bg-grape-soft text-grape hover:bg-grape hover:text-white"
                >
                  #{tt(tag)}
                </Link>
              ))}
            </div>
          </section>

          <EtiquetteCards rules={getEtiquetteFor(place)} locale={locale} />

          <section>
            <h2 className="mb-3 font-display text-xl font-extrabold text-ink">
              {t("nearby")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {nearby.map((p) => (
                <PlaceCard key={p.id} place={p} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="jq-card space-y-4 p-5">
            <div className="flex items-baseline justify-between">
              <span className="jq-label mb-0">{t("typicalStay")}</span>
              <span className="font-display text-xl font-extrabold text-ink">
                {tcommon("minutes", { count: place.stayMinutes })}
              </span>
            </div>

            {place.priceFrom != null && (
              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <span className="jq-label mb-0">{tcommon("from")}</span>
                <span className="font-display text-2xl font-extrabold text-berry">
                  ¥{place.priceFrom.toLocaleString()}
                </span>
              </div>
            )}

            <div className="space-y-2 border-t border-line pt-4">
              {place.bookable ? (
                <Link
                  href={`/book/${place.id}`}
                  className="jq-btn jq-btn-accent w-full"
                >
                  {t("bookHere", { service: SERVICE_NAME })}
                </Link>
              ) : (
                <p className="text-sm text-ink-soft">{t("bookExternal")}</p>
              )}
              <ShortlistButton id={place.id} variant="full" />
              <CheckInButton placeId={place.id} initialVisited={visited} />
            </div>

            <DemoNotice>{tcommon("demoNotice")}</DemoNotice>
          </div>

          <div className="jq-card overflow-hidden p-2">
            <div className="h-56">
              <PlaceMap
                points={[
                  {
                    id: place.id,
                    lat: place.lat,
                    lng: place.lng,
                    label: localized(place.name, locale),
                    color: place.image.from,
                  },
                ]}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
