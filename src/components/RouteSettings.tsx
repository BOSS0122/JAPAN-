"use client";

import { useTranslations } from "next-intl";
import type { StaminaLevel } from "@/lib/route-planner";

export interface RouteSettingsValue {
  days: number;
  startHour: number;
  stamina: StaminaLevel;
  accessibleOnly: boolean;
}

export function RouteSettings({
  value,
  onChange,
}: {
  value: RouteSettingsValue;
  onChange: (next: RouteSettingsValue) => void;
}) {
  const t = useTranslations("plan");

  return (
    <div className="jq-card space-y-4 p-5">
      <h3 className="font-display text-lg font-extrabold text-ink">{t("settings")}</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="jq-label" htmlFor="days">
            {t("days")}
          </label>
          <select
            id="days"
            className="jq-field"
            value={value.days}
            onChange={(e) => onChange({ ...value, days: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="jq-label" htmlFor="startHour">
            {t("startHour")}
          </label>
          <select
            id="startHour"
            className="jq-field"
            value={value.startHour}
            onChange={(e) => onChange({ ...value, startHour: Number(e.target.value) })}
          >
            {[7, 8, 9, 10, 11].map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="jq-label">{t("stamina")}</legend>
        <div className="space-y-2">
          {(
            [
              ["relaxed", t("staminaRelaxed"), "🐢"],
              ["standard", t("staminaStandard"), "🚶"],
              ["active", t("staminaActive"), "⚡"],
            ] as const
          ).map(([level, label, emoji]) => (
            <label
              key={level}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
                value.stamina === level
                  ? "border-grape bg-grape-soft text-grape"
                  : "border-line bg-paper text-ink-soft hover:border-grape"
              }`}
            >
              <input
                type="radio"
                name="stamina"
                className="sr-only"
                checked={value.stamina === level}
                onChange={() => onChange({ ...value, stamina: level })}
              />
              <span aria-hidden>{emoji}</span>
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-line bg-paper px-3 py-2.5 text-sm font-bold text-ink-soft">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-[#7c4dff]"
          checked={value.accessibleOnly}
          onChange={(e) => onChange({ ...value, accessibleOnly: e.target.checked })}
        />
        <span>♿ {t("accessibleOnly")}</span>
      </label>
    </div>
  );
}
