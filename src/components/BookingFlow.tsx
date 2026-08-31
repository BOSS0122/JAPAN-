"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Place } from "@/data/types";
import { t as localized } from "@/lib/localized";
import { createBookingAction } from "@/actions";
import { DemoNotice } from "./ui";

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function BookingFlow({
  place,
  /** False once launched with no payment processor: say so, don't fail silently. */
  payable = true,
}: {
  place: Place;
  payable?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("booking");
  const tc = useTranslations("common");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState(todayPlus(7));
  const [time, setTime] = useState(`${String(place.openHour + 1).padStart(2, "0")}:00`);
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [requests, setRequests] = useState("");
  const [pending, startTransition] = useTransition();

  const slots = Array.from(
    { length: Math.max(1, place.closeHour - place.openHour - 1) },
    (_, i) => `${String(place.openHour + i).padStart(2, "0")}:00`,
  );
  const unitPrice = place.priceFrom ?? 0;
  const total = unitPrice * partySize;
  const detailsValid = name.trim().length > 1 && /.+@.+\..+/.test(email);

  return (
    <div className="jq-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-cream px-5 py-3">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-berry" : "bg-line"}`}
          />
        ))}
        <span className="ml-2 shrink-0 text-xs font-bold text-ink-soft">
          {t("step", { n: step })}
        </span>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {step === 1 && (
          <>
            <h2 className="font-display text-xl font-extrabold text-ink">{t("when")}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="jq-label" htmlFor="date">
                  {t("date")}
                </label>
                <input
                  id="date"
                  type="date"
                  className="jq-field"
                  min={todayPlus(1)}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="jq-label" htmlFor="time">
                  {t("time")}
                </label>
                <select
                  id="time"
                  className="jq-field"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                >
                  {slots.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="jq-label" htmlFor="party">
                  {t("party")}
                </label>
                <select
                  id="party"
                  className="jq-field"
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {tc("people", { count: n })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="button" className="jq-btn jq-btn-accent" onClick={() => setStep(2)}>
              {tc("next")} →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display text-xl font-extrabold text-ink">{t("details")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="jq-label" htmlFor="name">
                  {t("name")}
                </label>
                <input
                  id="name"
                  className="jq-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="jq-label" htmlFor="email">
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  className="jq-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="jq-label" htmlFor="requests">
                {t("requests")} ({tc("optional")})
              </label>
              <textarea
                id="requests"
                rows={3}
                className="jq-field"
                placeholder={t("requestsHint")}
                value={requests}
                onChange={(e) => setRequests(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button type="button" className="jq-btn jq-btn-ghost" onClick={() => setStep(1)}>
                ← {tc("back")}
              </button>
              <button
                type="button"
                className="jq-btn jq-btn-accent"
                disabled={!detailsValid}
                onClick={() => setStep(3)}
              >
                {tc("next")} →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-display text-xl font-extrabold text-ink">{t("review")}</h2>
            <dl className="divide-y divide-line rounded-xl border border-line">
              {[
                [t("date"), date],
                [t("time"), time],
                [t("party"), tc("people", { count: partySize })],
                [t("name"), name],
                [t("email"), email],
                ...(requests ? [[t("requests"), requests] as const] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                  <dt className="font-bold text-ink-soft">{label}</dt>
                  <dd className="text-right text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            {unitPrice > 0 && (
              <div className="flex items-baseline justify-between rounded-xl bg-berry-soft px-4 py-3">
                <div>
                  <p className="text-xs font-bold uppercase text-berry">{t("total")}</p>
                  <p className="text-xs text-ink-soft">
                    {t("perPerson", { price: unitPrice.toLocaleString() })}
                  </p>
                </div>
                <p className="font-display text-2xl font-extrabold text-berry">
                  ¥{total.toLocaleString()}
                </p>
              </div>
            )}

            {payable ? (
              <DemoNotice>{t("payNote")}</DemoNotice>
            ) : (
              <p className="rounded-xl bg-berry-soft px-4 py-3 text-sm font-bold text-berry">
                {tc("paymentsPaused")}
              </p>
            )}

            <div className="flex gap-2">
              <button type="button" className="jq-btn jq-btn-ghost" onClick={() => setStep(2)}>
                ← {tc("back")}
              </button>
              <button
                type="button"
                className="jq-btn jq-btn-accent"
                disabled={pending || !payable}
                onClick={() =>
                  startTransition(async () => {
                    await createBookingAction({
                      placeId: place.id,
                      date,
                      time,
                      partySize,
                      name,
                      email,
                      requests,
                      locale,
                    });
                  })
                }
              >
                {pending ? tc("loading") : t("confirm")}
              </button>
            </div>
          </>
        )}
      </div>

      <p className="border-t border-line bg-cream px-5 py-3 text-xs text-ink-soft">
        {localized(place.name, locale)} · {localized(place.area, locale)}
      </p>
    </div>
  );
}
