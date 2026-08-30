"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const RATES = { general: 0.1, consumable: 0.08 } as const;
const MINIMUM_JPY = 5000;

export function TaxFreeCalculator() {
  const t = useTranslations("taxfree");
  const [amount, setAmount] = useState(30000);
  const [kind, setKind] = useState<keyof typeof RATES>("general");

  const rate = RATES[kind];
  const netPrice = Math.round(amount / (1 + rate));
  const refund = amount - netPrice;
  const eligible = amount >= MINIMUM_JPY;

  return (
    <section className="jq-card space-y-4 p-5">
      <header>
        <h2 className="font-display text-lg font-extrabold text-ink">🧾 {t("title")}</h2>
        <p className="text-sm text-ink-soft">{t("subtitle")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="jq-label" htmlFor="amount">
            {t("amount")}
          </label>
          <input
            id="amount"
            type="number"
            min={0}
            step={100}
            className="jq-field"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div>
          <label className="jq-label" htmlFor="kind">
            {t("kind")}
          </label>
          <select
            id="kind"
            className="jq-field"
            value={kind}
            onChange={(e) => setKind(e.target.value as keyof typeof RATES)}
          >
            <option value="general">{t("general")}</option>
            <option value="consumable">{t("consumable")}</option>
          </select>
        </div>
      </div>

      {eligible ? (
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-matcha-soft px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-matcha">
              {t("refund")}
            </p>
            <p className="font-display text-4xl font-extrabold text-matcha">
              ¥{refund.toLocaleString()}
            </p>
          </div>
          <p className="text-sm font-semibold text-ink-soft">
            {t("netPrice")}: ¥{netPrice.toLocaleString()} ({Math.round(rate * 100)}%)
          </p>
        </div>
      ) : (
        <p className="rounded-2xl bg-berry-soft px-5 py-4 text-sm font-bold text-berry">
          {t("belowMinimum")}
        </p>
      )}

      <p className="text-xs text-ink-soft">{t("note")}</p>
      <p className="text-xs text-ink-soft">{t("rules")}</p>
    </section>
  );
}
