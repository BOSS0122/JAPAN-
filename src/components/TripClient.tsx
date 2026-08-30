"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { places } from "@/data/places";
import { planCourse } from "@/lib/route-planner";
import { t as localized } from "@/lib/localized";
import { updateTripAction } from "@/actions";
import type { Trip } from "@/lib/store";
import { CourseView } from "./CourseView";
import { RouteSettings, type RouteSettingsValue } from "./RouteSettings";

export function TripClient({ trip, shareUrl }: { trip: Trip; shareUrl: string }) {
  const locale = useLocale();
  const t = useTranslations("trip");
  const tp = useTranslations("plan");
  const tc = useTranslations("common");

  const [title, setTitle] = useState(trip.title);
  const [placeIds, setPlaceIds] = useState(trip.placeIds);
  const [settings, setSettings] = useState<RouteSettingsValue>({
    days: trip.days,
    startHour: trip.startHour,
    stamina: trip.stamina,
    accessibleOnly: trip.accessibleOnly,
  });
  const [preferIndoor, setPreferIndoor] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const course = useMemo(
    () => planCourse({ placeIds, preferIndoor, ...settings }),
    [placeIds, settings, preferIndoor],
  );

  const available = places.filter((p) => !placeIds.includes(p.id));

  // Anyone with the link can write; every change is pushed for the whole group.
  function persist(next: { title?: string; placeIds?: string[] } & Partial<RouteSettingsValue>) {
    startTransition(async () => {
      await updateTripAction(trip.shareId, {
        title: next.title ?? title,
        placeIds: next.placeIds ?? placeIds,
        days: next.days ?? settings.days,
        stamina: next.stamina ?? settings.stamina,
        accessibleOnly: next.accessibleOnly ?? settings.accessibleOnly,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
      <div className="space-y-4 lg:sticky lg:top-24">
        <div className="jq-card space-y-3 p-5">
          <label className="jq-label" htmlFor="tripTitle">
            {t("rename")}
          </label>
          <input
            id="tripTitle"
            className="jq-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => persist({ title })}
          />

          <p className="jq-label mb-0">{t("linkLabel")}</p>
          <input readOnly value={shareUrl} className="jq-field text-xs" />
          <button
            type="button"
            className="jq-btn jq-btn-ghost w-full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                setCopied(false);
              }
            }}
          >
            🔗 {copied ? tc("copied") : tc("copy")}
          </button>
          <p className="text-xs text-ink-soft">{t("linkHint")}</p>
          {(pending || saved) && (
            <p className="text-xs font-bold text-matcha">
              {pending ? tc("loading") : `✓ ${t("saved")}`}
            </p>
          )}
        </div>

        <RouteSettings
          value={settings}
          onChange={(next) => {
            setSettings(next);
            persist(next);
          }}
        />

        <div className="jq-card space-y-3 p-5">
          <button
            type="button"
            onClick={() => setPreferIndoor((v) => !v)}
            className={`jq-btn w-full ${preferIndoor ? "jq-btn-ghost" : "jq-btn-primary"}`}
          >
            <span aria-hidden>{preferIndoor ? "☀️" : "🌧"}</span>
            {preferIndoor ? tp("resetPlan") : tp("replan")}
          </button>

          <label className="jq-label mb-0" htmlFor="addStop">
            {t("editStops")}
          </label>
          <select
            id="addStop"
            className="jq-field"
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              const next = [...placeIds, e.target.value];
              setPlaceIds(next);
              persist({ placeIds: next });
            }}
          >
            <option value="">＋ {tc("select")}…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {localized(p.name, locale)} — {localized(p.area, locale)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <CourseView
        course={course}
        onRemove={(id) => {
          const next = placeIds.filter((x) => x !== id);
          setPlaceIds(next);
          persist({ placeIds: next });
        }}
      />
    </div>
  );
}
