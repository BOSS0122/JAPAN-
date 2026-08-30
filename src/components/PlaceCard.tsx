"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Place } from "@/data/types";
import { t as localized } from "@/lib/localized";
import { CATEGORY_STYLE, CrowdMeter } from "./ui";
import { ShortlistButton } from "./ShortlistButton";

export function PlaceCard({ place, highlight }: { place: Place; highlight?: string }) {
  const locale = useLocale();
  const tc = useTranslations("categories");
  const tt = useTranslations("tags");
  const tcrowd = useTranslations("crowd");
  const tcommon = useTranslations("common");
  const tr = useTranslations("rewards");
  const style = CATEGORY_STYLE[place.category];

  return (
    <article className="jq-card group flex flex-col overflow-hidden">
      <Link href={`/places/${place.id}`} className="block">
        <div
          className="relative flex h-36 items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(135deg, ${place.image.from}, ${place.image.to})`,
          }}
        >
          <span aria-hidden className="text-5xl drop-shadow-sm">
            {place.image.emoji}
          </span>
          {!place.famous && (
            <span className="absolute left-3 top-3 jq-chip bg-white/90 text-ink">
              💎 {tr("hiddenGem")}
            </span>
          )}
          {highlight && (
            <span className="absolute right-3 top-3 jq-chip bg-ink/85 text-white">
              {highlight}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className={`jq-chip ${style.chip}`}>
            <span aria-hidden>{style.emoji}</span>
            {tc(place.category)}
          </span>
          <CrowdMeter level={place.crowd} label={tcrowd(place.crowd)} />
        </div>

        <div>
          <h3 className="font-display text-lg font-extrabold leading-snug text-ink">
            <Link href={`/places/${place.id}`} className="hover:text-grape">
              {localized(place.name, locale)}
            </Link>
          </h3>
          <p className="text-xs font-semibold text-ink-soft">
            📍 {localized(place.area, locale)}
          </p>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">
          {localized(place.description, locale)}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {place.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="jq-chip bg-cream text-ink-soft">
              #{tt(tag)}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          <div className="text-xs font-semibold text-ink-soft">
            <span>⏱ {tcommon("minutes", { count: place.stayMinutes })}</span>
            {place.priceFrom != null && (
              <span className="ml-2 text-ink">
                {tcommon("from")} ¥{place.priceFrom.toLocaleString()}
              </span>
            )}
          </div>
          <ShortlistButton id={place.id} />
        </div>
      </div>
    </article>
  );
}
