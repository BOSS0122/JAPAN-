"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { alerts, translationSample } from "@/data/support";
import { t as localized } from "@/lib/localized";
import { routing } from "@/i18n/routing";
import { DemoNotice } from "./ui";

const SEVERITY_STYLE = {
  info: "bg-lagoon-soft text-lagoon",
  advisory: "bg-sunshine-soft text-[#8a5b00]",
  warning: "bg-berry-soft text-berry",
} as const;

export function SupportClient({
  partnerLinks,
}: {
  /** Signed on the server — see src/lib/partner-link.ts. */
  partnerLinks: Record<"esim" | "wifi" | "luggage", string>;
}) {
  const locale = useLocale();
  const t = useTranslations("support");
  const tc = useTranslations("common");

  const [balance, setBalance] = useState(1_480);
  const [scanned, setScanned] = useState(false);
  const [pushOn, setPushOn] = useState(false);

  const translated =
    translationSample.translated[locale] ??
    translationSample.translated[routing.defaultLocale];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="jq-card space-y-4 p-5">
        <header>
          <h2 className="font-display text-lg font-extrabold text-ink">
            💳 {t("icTitle")}
          </h2>
          <p className="text-sm text-ink-soft">{t("icBody")}</p>
        </header>

        <div className="rounded-2xl bg-gradient-to-br from-lagoon to-grape p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-white/80">
            {t("icBalance")}
          </p>
          <p className="font-display text-4xl font-extrabold">¥{balance.toLocaleString()}</p>
          <p className="mt-3 font-mono text-xs tracking-widest text-white/70">
            JQ •••• 4821 · Suica
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="jq-btn jq-btn-accent"
            onClick={() => setBalance((b) => b + 3000)}
          >
            ＋ {t("icTopUp")}
          </button>
          <span className="jq-chip bg-cream text-ink-soft">📱 QR</span>
        </div>

        <DemoNotice>{t("icDemo")}</DemoNotice>
      </section>

      <section className="jq-card space-y-4 p-5">
        <header>
          <h2 className="font-display text-lg font-extrabold text-ink">
            📷 {t("translateTitle")}
          </h2>
          <p className="text-sm text-ink-soft">{t("translateBody")}</p>
        </header>

        {!scanned ? (
          <>
            <div className="relative grid h-48 place-items-center overflow-hidden rounded-2xl border-4 border-dashed border-line bg-cream">
              <ul aria-hidden className="space-y-1 text-center text-sm text-ink-soft/70">
                {translationSample.source.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <span className="absolute right-3 top-3 jq-chip bg-paper text-ink-soft">
                📸 {tc("demoBadge")}
              </span>
            </div>
            <button
              type="button"
              className="jq-btn jq-btn-accent w-full"
              onClick={() => setScanned(true)}
            >
              {t("translateButton")}
            </button>
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-cream p-4">
                <p className="jq-label">日本語</p>
                <ul className="space-y-1 text-sm text-ink-soft">
                  {translationSample.source.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-matcha-soft p-4">
                <p className="jq-label">{t("translateResult")}</p>
                <ul className="space-y-1 text-sm font-semibold text-ink">
                  {translated.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              type="button"
              className="jq-btn jq-btn-ghost w-full"
              onClick={() => setScanned(false)}
            >
              {t("translateAgain")}
            </button>
          </>
        )}
      </section>

      <section className="jq-card space-y-4 p-5">
        <header className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-extrabold text-ink">
              🚨 {t("alertsTitle")}
            </h2>
            <p className="text-sm text-ink-soft">{t("alertsBody")}</p>
          </div>
          <button
            type="button"
            aria-pressed={pushOn}
            onClick={() => setPushOn((v) => !v)}
            className={`jq-btn ${pushOn ? "jq-btn-ghost" : "jq-btn-primary"}`}
          >
            {pushOn ? `🔔 ${t("alertsEnabled")}` : t("alertsEnable")}
          </button>
        </header>

        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded-2xl border border-line p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`jq-chip ${SEVERITY_STYLE[alert.severity]}`}>
                  {t(`severity.${alert.severity}`)}
                </span>
                <span className="text-xs font-bold text-ink-soft">{alert.area}</span>
                <span className="ml-auto text-xs text-ink-soft/70">
                  {new Date(alert.issuedAt).toLocaleString(locale, {
                    timeZone: "Asia/Tokyo",
                    dateStyle: "short",
                    timeStyle: "short",
                  })}{" "}
                  JST
                </span>
              </div>
              <p className="mt-2 font-display text-base font-extrabold text-ink">
                {localized(alert.title, locale)}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{localized(alert.body, locale)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="jq-card space-y-4 p-5">
        <header>
          <h2 className="font-display text-lg font-extrabold text-ink">
            📶 {t("connectTitle")}
          </h2>
          <p className="text-sm text-ink-soft">{t("connectBody")}</p>
        </header>

        <ul className="space-y-3">
          {(
            [
              ["esim", "📱", "#ece4ff"],
              ["wifi", "📡", "#d9f5fb"],
              ["luggage", "🧳", "#fff0e2"],
            ] as const
          ).map(([key, emoji, bg]) => (
            <li
              key={key}
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{ backgroundColor: bg }}
            >
              <span aria-hidden className="text-2xl">
                {emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-extrabold text-ink">{t(key)}</p>
                <p className="text-xs text-ink-soft">{t("partnerLink")}</p>
              </div>
              <a
                href={partnerLinks[key]}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="jq-btn jq-btn-primary"
              >
                ↗
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
