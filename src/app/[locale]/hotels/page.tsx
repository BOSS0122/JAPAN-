import { getTranslations, setRequestLocale } from "next-intl/server";
import { partnerHref } from "@/lib/partner-link";
import { pipelineValueJpy } from "@/config/revenue";
import { listPlaces } from "@/lib/repo/places";
import { t as localized } from "@/lib/localized";
import { getHotelProvider } from "@/lib/providers";
import { DemoNotice, SectionHeading } from "@/components/ui";

function inDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function HotelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const one = (key: string, fallback: string) =>
    typeof sp[key] === "string" && sp[key] ? (sp[key] as string) : fallback;

  const t = await getTranslations("hotels");
  const tperks = await getTranslations("hotels.perks");

  const places = await listPlaces();
  const areaOptions = [
    ...new Map(places.map((p) => [p.areaKey, localized(p.area, locale)])).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1]));

  const query = {
    areaKey: one("area", "tokyo"),
    checkIn: one("checkIn", inDays(30)),
    checkOut: one("checkOut", inDays(33)),
    guests: Math.min(8, Math.max(1, Number(one("guests", "2")) || 2)),
    rooms: Math.min(4, Math.max(1, Number(one("rooms", "1")) || 1)),
  };

  const offers = await getHotelProvider().search(query);

  return (
    <div className="space-y-6">
      <SectionHeading title={t("title")} sub={t("subtitle")} />

      <form className="jq-card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="jq-label" htmlFor="area">
            {t("area")}
          </label>
          <select id="area" name="area" defaultValue={query.areaKey} className="jq-field">
            {areaOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="jq-label" htmlFor="checkIn">
            {t("checkIn")}
          </label>
          <input
            id="checkIn"
            name="checkIn"
            type="date"
            defaultValue={query.checkIn}
            className="jq-field"
          />
        </div>
        <div>
          <label className="jq-label" htmlFor="checkOut">
            {t("checkOut")}
          </label>
          <input
            id="checkOut"
            name="checkOut"
            type="date"
            defaultValue={query.checkOut}
            className="jq-field"
          />
        </div>
        <div>
          <label className="jq-label" htmlFor="guests">
            {t("guests")}
          </label>
          <input
            id="guests"
            name="guests"
            type="number"
            min={1}
            max={8}
            defaultValue={query.guests}
            className="jq-field"
          />
        </div>
        <div>
          <label className="jq-label" htmlFor="rooms">
            {t("rooms")}
          </label>
          <input
            id="rooms"
            name="rooms"
            type="number"
            min={1}
            max={4}
            defaultValue={query.rooms}
            className="jq-field"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-5">
          <button type="submit" className="jq-btn jq-btn-accent w-full sm:w-auto">
            🔎 {t("search")}
          </button>
        </div>
      </form>

      <DemoNotice>{t("subtitle")}</DemoNotice>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <li key={offer.id} className="jq-card flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg font-extrabold leading-snug text-ink">
                {offer.hotelName}
              </h3>
              <span className="jq-chip bg-lagoon-soft text-lagoon">{offer.partnerName}</span>
            </div>
            <p className="text-sm text-ink-soft">
              ⭐ {t("rating", { rating: offer.rating, count: offer.reviewCount })}
            </p>
            <p className="text-sm text-ink-soft">
              📍 {t("distance", { km: offer.distanceKm })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {offer.perks.map((perk) => (
                <span key={perk} className="jq-chip bg-cream text-ink-soft">
                  {tperks(perk)}
                </span>
              ))}
            </div>
            <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3">
              <div>
                <p className="font-display text-xl font-extrabold text-berry">
                  ¥{offer.nightlyJpy.toLocaleString()}
                </p>
                <p className="text-xs text-ink-soft">{t("perNight")}</p>
              </div>
              <a
                href={partnerHref({
                  url: offer.deepLink,
                  partnerId: offer.partnerId,
                  partnerName: offer.partnerName,
                  surface: "hotel",
                  ref: offer.id,
                  estimatedValueJpy: pipelineValueJpy("hotel", offer.nightlyJpy),
                })}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="jq-btn jq-btn-primary"
              >
                {t("bookWith", { partner: offer.partnerName })} ↗
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
