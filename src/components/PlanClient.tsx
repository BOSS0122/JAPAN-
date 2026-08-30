"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { planCourse } from "@/lib/route-planner";
import type { Place } from "@/data/types";
import { createTripAction, loadPlacesAction } from "@/actions";
import { useShortlist } from "./shortlist";
import { CourseView } from "./CourseView";
import { RouteSettings, type RouteSettingsValue } from "./RouteSettings";
import { SectionHeading } from "./ui";

export function PlanClient() {
  const locale = useLocale();
  const t = useTranslations("plan");
  const tc = useTranslations("common");
  const ttrip = useTranslations("trip");
  const { ids, ready, remove } = useShortlist();

  const [settings, setSettings] = useState<RouteSettingsValue>({
    days: 2,
    startHour: 9,
    stamina: "standard",
    accessibleOnly: false,
  });
  const [preferIndoor, setPreferIndoor] = useState(false);
  const [title, setTitle] = useState("Japan trip");
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  // Only the shortlisted places are fetched — never the whole catalogue.
  const [places, setPlaces] = useState<Place[] | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    loadPlacesAction(ids).then((next) => {
      if (!cancelled) setPlaces(next);
    });
    return () => {
      cancelled = true;
    };
    // `key` collapses the array into a stable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  const course = useMemo(
    () => planCourse({ places: places ?? [], preferIndoor, ...settings }),
    [places, settings, preferIndoor],
  );

  if (!ready || (ids.length > 0 && places === null)) {
    return <p className="jq-card p-8 text-center text-sm text-ink-soft">{tc("loading")}</p>;
  }

  if (ids.length === 0) {
    return (
      <div className="jq-card p-10 text-center">
        <p className="text-4xl" aria-hidden>
          🧳
        </p>
        <p className="mt-3 font-display text-xl font-extrabold text-ink">{t("empty")}</p>
        <Link href="/explore" className="jq-btn jq-btn-accent mt-4">
          {t("emptyCta")} →
        </Link>
      </div>
    );
  }

  const shareUrl =
    shareId && typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/trips/${shareId}`
      : null;

  return (
    <div className="space-y-6">
      <SectionHeading title={t("title")} sub={t("subtitle")} />

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
        <div className="space-y-4 lg:sticky lg:top-24">
          <RouteSettings value={settings} onChange={setSettings} />

          <div className="jq-card space-y-3 p-5">
            <button
              type="button"
              onClick={() => setPreferIndoor((v) => !v)}
              className={`jq-btn w-full ${preferIndoor ? "jq-btn-ghost" : "jq-btn-primary"}`}
            >
              <span aria-hidden>{preferIndoor ? "☀️" : "🌧"}</span>
              {preferIndoor ? t("resetPlan") : t("replan")}
            </button>
            {preferIndoor && (
              <p className="rounded-xl bg-lagoon-soft px-3 py-2 text-xs font-semibold text-lagoon">
                {t("replanned")}
              </p>
            )}
          </div>

          <div className="jq-card space-y-3 p-5">
            <label className="jq-label" htmlFor="tripTitle">
              {ttrip("rename")}
            </label>
            <input
              id="tripTitle"
              className="jq-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const id = await createTripAction({
                    title,
                    placeIds: ids,
                    locale,
                    ...settings,
                  });
                  setShareId(id);
                })
              }
              className="jq-btn jq-btn-accent w-full"
            >
              <span aria-hidden>🔗</span>
              {pending ? t("shareCreating") : t("share")}
            </button>

            {shareUrl && (
              <div className="space-y-2">
                <p className="jq-label mb-0">{ttrip("linkLabel")}</p>
                <input readOnly value={shareUrl} className="jq-field text-xs" />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch {
                        setCopied(false);
                      }
                    }}
                    className="jq-btn jq-btn-ghost flex-1"
                  >
                    {copied ? tc("copied") : tc("copy")}
                  </button>
                  <Link href={`/trips/${shareId}`} className="jq-btn jq-btn-primary flex-1">
                    {tc("next")} →
                  </Link>
                </div>
                <p className="text-xs text-ink-soft">{ttrip("linkHint")}</p>
              </div>
            )}
          </div>
        </div>

        <CourseView course={course} onRemove={remove} />
      </div>
    </div>
  );
}
