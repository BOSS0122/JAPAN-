import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { places } from "@/data/places";
import { currentSeason, getWeather, seasonalPicks } from "@/lib/season";
import { PlaceCard } from "@/components/PlaceCard";
import { SectionHeading, Stat } from "@/components/ui";
import { locales } from "@/i18n/routing";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tw = await getTranslations("weather");
  const ts = await getTranslations("seasons");

  const season = currentSeason();
  const weather = getWeather("tokyo");
  const picks = seasonalPicks(places, season, weather.weather, 4);
  const hidden = places.filter((p) => !p.famous).slice(0, 4);
  const areaCount = new Set(places.map((p) => p.areaKey)).size;

  return (
    <div className="space-y-16">
      <section className="jq-card overflow-hidden">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <p className="jq-chip bg-berry-soft text-berry">{t("eyebrow")}</p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              {t("subtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/explore" className="jq-btn jq-btn-accent">
                {t("ctaExplore")} →
              </Link>
              <Link href="/plan" className="jq-btn jq-btn-ghost">
                {t("ctaPlan")}
              </Link>
            </div>
            <div className="mt-8 flex gap-8">
              <Stat value={String(places.length)} label={t("statSpots")} />
              <Stat value={String(locales.length)} label={t("statLanguages")} />
              <Stat value={String(areaCount)} label={t("statAreas")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {places.slice(0, 9).map((p, i) => (
              <div
                key={p.id}
                className={`grid aspect-square place-items-center rounded-2xl text-3xl ${
                  i % 4 === 0 ? "rotate-2" : i % 3 === 0 ? "-rotate-2" : ""
                }`}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${p.image.from}, ${p.image.to})`,
                }}
              >
                <span aria-hidden>{p.image.emoji}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow={ts(season)}
          title={t("rightNow")}
          sub={t("rightNowSub", {
            season: ts(season),
            area: "Tokyo",
            weather: tw(weather.weather),
            temp: weather.tempC,
          })}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {picks.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              highlight={
                season === "spring"
                  ? ts("springNote")
                  : season === "autumn"
                    ? ts("autumnNote")
                    : undefined
              }
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title={t("offbeat")} sub={t("offbeatSub")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hidden.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title={t("howTitle")} />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["step1Title", "step1Body", "🔍", "bg-berry-soft"],
              ["step2Title", "step2Body", "🧳", "bg-lagoon-soft"],
              ["step3Title", "step3Body", "🗺️", "bg-sunshine-soft"],
              ["step4Title", "step4Body", "✅", "bg-matcha-soft"],
            ] as const
          ).map(([title, body, emoji, bg], i) => (
            <li key={title} className={`jq-card p-5 ${bg}`}>
              <span aria-hidden className="text-3xl">
                {emoji}
              </span>
              <p className="mt-3 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                {i + 1}
              </p>
              <h3 className="font-display text-lg font-extrabold text-ink">{t(title)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{t(body)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
