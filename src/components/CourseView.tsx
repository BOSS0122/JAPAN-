"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Course } from "@/lib/route-planner";
import { formatClock } from "@/lib/route-planner";
import { t as localized } from "@/lib/localized";
import { CATEGORY_STYLE } from "./ui";
import { PlaceMap } from "./PlaceMap";
import type { MapPoint } from "./MapCanvas";

export function CourseView({
  course,
  onRemove,
}: {
  course: Course;
  onRemove?: (placeId: string) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("plan");
  const tc = useTranslations("common");
  const tcat = useTranslations("categories");
  const [view, setView] = useState<"timeline" | "map">("timeline");

  const allStops = course.days.flatMap((d) => d.stops);

  const points: MapPoint[] = allStops.map((stop, i) => ({
    id: stop.place.id,
    lat: stop.place.lat,
    lng: stop.place.lng,
    label: localized(stop.place.name, locale),
    color: stop.place.image.from,
    index: i + 1,
  }));

  const path = allStops.map(
    (stop) => [stop.place.lat, stop.place.lng] as [number, number],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border-2 border-line bg-paper p-1">
          {(["timeline", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                view === v ? "bg-ink text-white" : "text-ink-soft hover:text-grape"
              }`}
            >
              {t(v)}
            </button>
          ))}
        </div>
        <span className="jq-chip bg-matcha-soft text-matcha">
          🚶 {t("walkTotal", { value: course.totalWalkKm })}
        </span>
        <span className="jq-chip bg-lagoon-soft text-lagoon">
          📌 {t("totalStops", { count: allStops.length })}
        </span>
      </div>

      {view === "map" ? (
        <div className="jq-card overflow-hidden p-2">
          <div className="h-[28rem]">
            <PlaceMap points={points} path={path} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {course.days.map((day) => (
            <section key={day.day} className="jq-card overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-cream px-5 py-3">
                <h3 className="font-display text-lg font-extrabold text-ink">
                  {t("day", { n: day.day })}
                </h3>
                <p className="text-xs font-bold text-ink-soft">
                  {formatClock(day.stops[0]?.arrive ?? 0)} – {formatClock(day.endMinutes)} ·{" "}
                  {t("walkTotal", { value: day.walkKm })}
                </p>
              </header>

              <ol className="divide-y divide-line">
                {day.stops.map((stop, i) => {
                  const style = CATEGORY_STYLE[stop.place.category];
                  return (
                    <li key={stop.place.id} className="p-4 sm:p-5">
                      {i === 0 ? (
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">
                          ▸ {t("startOfDay")}
                        </p>
                      ) : (
                        <p className="mb-3 flex items-center gap-2 text-xs font-bold text-ink-soft">
                          <span aria-hidden>{stop.mode === "walk" ? "🚶" : "🚃"}</span>
                          {stop.mode === "walk"
                            ? t("travelWalk", { minutes: stop.travelMinutes, km: stop.travelKm })
                            : t("travelTransit", {
                                minutes: stop.travelMinutes,
                                km: stop.travelKm,
                              })}
                        </p>
                      )}

                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${stop.place.image.from}, ${stop.place.image.to})`,
                            }}
                            aria-hidden
                          >
                            {stop.place.image.emoji}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-display text-base font-extrabold text-ink">
                            <Link
                              href={`/places/${stop.place.id}`}
                              className="hover:text-grape"
                            >
                              {localized(stop.place.name, locale)}
                            </Link>
                          </p>
                          <p className="text-sm font-bold text-berry">
                            {formatClock(stop.arrive)} – {formatClock(stop.depart)}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={`jq-chip ${style.chip}`}>
                              {tcat(stop.place.category)}
                            </span>
                            <span className="jq-chip bg-cream text-ink-soft">
                              📍 {localized(stop.place.area, locale)}
                            </span>
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {stop.place.bookable && (
                              <Link
                                href={`/book/${stop.place.id}`}
                                className="jq-chip border-2 border-berry bg-berry-soft text-berry hover:bg-berry hover:text-white"
                              >
                                {t("bookThis")}
                              </Link>
                            )}
                            {onRemove && (
                              <button
                                type="button"
                                onClick={() => onRemove(stop.place.id)}
                                className="jq-chip border-2 border-line bg-paper text-ink-soft hover:border-berry hover:text-berry"
                              >
                                {tc("remove")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      {course.dropped.length > 0 && (
        <div className="jq-card border-dashed p-4">
          <h4 className="font-display text-sm font-extrabold text-ink">{t("dropped")}</h4>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">
            {course.dropped.map(({ place, reason }) => (
              <li key={place.id}>
                <span className="font-bold text-ink">{localized(place.name, locale)}</span>{" "}
                —{" "}
                {reason === "accessibility"
                  ? t("droppedAccessibility")
                  : reason === "weather"
                    ? t("droppedWeather")
                    : t("droppedNoTime", { days: course.options.days })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
