import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listPlaces, listPlacesBySlugs } from "@/lib/repo/places";
import { t as localized } from "@/lib/localized";
import { BADGES, stampValue } from "@/lib/badges";
import { getTravellerId } from "@/lib/session";
import { listVisits } from "@/lib/store";
import { CheckInButton } from "@/components/CheckInButton";
import { SectionHeading } from "@/components/ui";
import { TaxFreeCalculator } from "@/components/TaxFreeCalculator";

export default async function RewardsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("rewards");
  const travellerId = await getTravellerId();
  const visits = await listVisits(travellerId);
  const visitedIds = new Set(visits.map((v) => v.placeId));
  const places = await listPlaces();
  const visited = await listPlacesBySlugs([...visitedIds]);

  const earned = visited.reduce((sum, p) => sum + stampValue(p), 0);
  const total = places.reduce((sum, p) => sum + stampValue(p), 0);

  // Hidden gems first: they are what the rally is trying to push traffic toward.
  const stampBoard = [...places].sort(
    (a, b) => Number(a.famous) - Number(b.famous) || a.id.localeCompare(b.id),
  );

  return (
    <div className="space-y-10">
      <SectionHeading title={t("title")} sub={t("subtitle")} />

      <section className="jq-card overflow-hidden">
        <div className="bg-gradient-to-r from-berry to-tangerine px-6 py-6 text-white">
          <p className="text-sm font-bold uppercase tracking-wide text-white/85">
            {t("progress", { done: earned, total })}
          </p>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${Math.round((earned / total) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-5">
          <h2 className="font-display text-lg font-extrabold text-ink">{t("badgesTitle")}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {BADGES.map((badge) => {
              const progress = badge.progress(visited);
              const unlocked = progress >= badge.target;
              return (
                <li
                  key={badge.key}
                  className={`rounded-2xl border-2 p-4 text-center ${
                    unlocked ? "border-sunshine bg-sunshine-soft" : "border-line bg-cream"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`text-3xl ${unlocked ? "" : "opacity-30 grayscale"}`}
                  >
                    {badge.emoji}
                  </span>
                  <p className="mt-2 font-display text-sm font-extrabold text-ink">
                    {t(`badges.${badge.key}`)}
                  </p>
                  <p className="text-xs text-ink-soft">{t(`badges.${badge.key}Desc`)}</p>
                  <p className="mt-1 text-xs font-bold text-ink-soft">
                    {unlocked
                      ? "✓"
                      : `${Math.min(progress, badge.target)} / ${badge.target}`}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-extrabold text-ink">
          {t("stampsTitle")}
        </h2>
        {visitedIds.size === 0 && (
          <p className="mb-4 text-sm text-ink-soft">{t("noStamps")}</p>
        )}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stampBoard.map((place) => {
            const done = visitedIds.has(place.id);
            return (
              <li
                key={place.id}
                className={`jq-card flex items-center gap-3 p-4 ${done ? "" : "opacity-90"}`}
              >
                <span
                  aria-hidden
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl ${
                    done ? "" : "grayscale"
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${place.image.from}, ${place.image.to})`,
                  }}
                >
                  {done ? "🏅" : place.image.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-extrabold text-ink">
                    <Link href={`/places/${place.id}`} className="hover:text-grape">
                      {localized(place.name, locale)}
                    </Link>
                  </p>
                  <p className="text-xs text-ink-soft">
                    {localized(place.area, locale)}
                    {!place.famous && (
                      <span className="ml-1 font-bold text-berry">💎 {t("hiddenGem")}</span>
                    )}
                  </p>
                  <p className="text-xs font-bold text-ink-soft">+{stampValue(place)}</p>
                </div>
                <CheckInButton placeId={place.id} initialVisited={done} />
              </li>
            );
          })}
        </ul>
      </section>

      <TaxFreeCalculator />
    </div>
  );
}
