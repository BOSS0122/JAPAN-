import { getTranslations } from "next-intl/server";
import type { EtiquetteRule, EtiquetteSeverity } from "@/data/etiquette";
import { t as localized } from "@/lib/localized";

const SEVERITY_STYLE: Record<EtiquetteSeverity, string> = {
  must: "bg-berry-soft text-berry",
  should: "bg-sunshine-soft text-[#8a5b00]",
  fyi: "bg-lagoon-soft text-lagoon",
};

export async function EtiquetteCards({
  rules,
  locale,
  heading,
  compact = false,
}: {
  rules: EtiquetteRule[];
  locale: string;
  heading?: string;
  compact?: boolean;
}) {
  if (rules.length === 0) return null;
  const t = await getTranslations("etiquette");

  return (
    <section>
      <div className="mb-3">
        <h2 className={compact ? "font-display text-lg font-extrabold text-ink" : "font-display text-xl font-extrabold text-ink"}>
          {heading ?? t("title")}
        </h2>
        {!compact && <p className="mt-1 text-sm text-ink-soft">{t("subtitle")}</p>}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {rules.map((rule) => (
          <li key={rule.id} className="jq-card p-4">
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-2xl leading-none">
                {rule.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-extrabold text-ink">
                    {localized(rule.title, locale)}
                  </h3>
                  <span className={`jq-chip ${SEVERITY_STYLE[rule.severity]}`}>
                    {t(rule.severity)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {localized(rule.body, locale)}
                </p>
                <p className="mt-2 border-t border-line pt-2 text-sm leading-relaxed text-ink-soft">
                  <span className="font-bold text-grape">{t("whyLabel")}: </span>
                  {localized(rule.why, locale)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-ink-soft">{t("reassure")}</p>
    </section>
  );
}
