import { getTranslations, setRequestLocale } from "next-intl/server";
import { partnerHref } from "@/lib/partner-link";
import { pipelineValueJpy } from "@/config/revenue";
import { getFlightProvider } from "@/lib/providers";
import { SERVICE_NAME } from "@/config/site";
import { DemoNotice, SectionHeading } from "@/components/ui";
import { localeAlternates } from "@/lib/seo";

const AIRPORTS = [
  { code: "BKK", city: "Bangkok" },
  { code: "SIN", city: "Singapore" },
  { code: "LHR", city: "London" },
  { code: "SFO", city: "San Francisco" },
  { code: "SYD", city: "Sydney" },
  { code: "TPE", city: "Taipei" },
];

const ARRIVALS = [
  { code: "NRT", city: "Tokyo Narita" },
  { code: "HND", city: "Tokyo Haneda" },
  { code: "KIX", city: "Osaka Kansai" },
  { code: "CTS", city: "Sapporo New Chitose" },
  { code: "FUK", city: "Fukuoka" },
];

function inDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return { alternates: localeAlternates(locale, "/flights") };
}

export default async function FlightsPage({
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

  const t = await getTranslations("flights");
  const tc = await getTranslations("common");

  const query = {
    origin: one("origin", "BKK"),
    destination: one("destination", "NRT"),
    departDate: one("depart", inDays(30)),
    returnDate: one("return", inDays(37)),
    passengers: Math.min(9, Math.max(1, Number(one("passengers", "1")) || 1)),
    cabin: one("cabin", "economy") as "economy" | "premium" | "business",
  };

  const offers = await getFlightProvider().search(query);

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("title")}
        sub={t("subtitle", { service: SERVICE_NAME })}
      />

      <form className="jq-card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label className="jq-label" htmlFor="origin">
            {t("origin")}
          </label>
          <select id="origin" name="origin" defaultValue={query.origin} className="jq-field">
            {AIRPORTS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.city} ({a.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="jq-label" htmlFor="destination">
            {t("destination")}
          </label>
          <select
            id="destination"
            name="destination"
            defaultValue={query.destination}
            className="jq-field"
          >
            {ARRIVALS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.city} ({a.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="jq-label" htmlFor="depart">
            {t("depart")}
          </label>
          <input
            id="depart"
            name="depart"
            type="date"
            defaultValue={query.departDate}
            className="jq-field"
          />
        </div>
        <div>
          <label className="jq-label" htmlFor="return">
            {t("return")}
          </label>
          <input
            id="return"
            name="return"
            type="date"
            defaultValue={query.returnDate}
            className="jq-field"
          />
        </div>
        <div>
          <label className="jq-label" htmlFor="passengers">
            {t("passengers")}
          </label>
          <input
            id="passengers"
            name="passengers"
            type="number"
            min={1}
            max={9}
            defaultValue={query.passengers}
            className="jq-field"
          />
        </div>
        <div>
          <label className="jq-label" htmlFor="cabin">
            {t("cabin")}
          </label>
          <select id="cabin" name="cabin" defaultValue={query.cabin} className="jq-field">
            <option value="economy">{t("economy")}</option>
            <option value="premium">{t("premium")}</option>
            <option value="business">{t("business")}</option>
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-6">
          <button type="submit" className="jq-btn jq-btn-accent w-full sm:w-auto">
            🔎 {t("search")}
          </button>
        </div>
      </form>

      <DemoNotice>{t("disclaimer")}</DemoNotice>

      <p className="text-sm font-bold text-ink">{t("results", { count: offers.length })}</p>

      <ul className="space-y-3">
        {offers.map((offer) => (
          <li
            key={offer.id}
            className="jq-card flex flex-wrap items-center gap-4 p-4 sm:p-5"
          >
            <div className="min-w-[9rem] flex-1">
              <p className="font-display text-lg font-extrabold text-ink">{offer.airline}</p>
              <p className="text-sm text-ink-soft">
                {query.origin} → {query.destination}
              </p>
            </div>
            <div className="min-w-[8rem]">
              <p className="font-display text-lg font-extrabold text-ink">
                {offer.departTime} → {offer.arriveTime}
              </p>
              <p className="text-sm text-ink-soft">
                {t("duration", {
                  h: Math.floor(offer.durationMinutes / 60),
                  m: offer.durationMinutes % 60,
                })}
              </p>
            </div>
            <span
              className={`jq-chip ${
                offer.stops === 0 ? "bg-matcha-soft text-matcha" : "bg-cream text-ink-soft"
              }`}
            >
              {t("stops", { count: offer.stops })}
            </span>
            <div className="ml-auto text-right">
              <p className="font-display text-2xl font-extrabold text-berry">
                ¥{offer.priceJpy.toLocaleString()}
              </p>
              <p className="text-xs text-ink-soft">
                {tc("people", { count: query.passengers })}
              </p>
            </div>
            <a
              href={partnerHref({
                url: offer.deepLink,
                partnerId: offer.partnerId,
                partnerName: offer.partnerName,
                surface: "flight",
                ref: offer.id,
                estimatedValueJpy: pipelineValueJpy("flight", offer.priceJpy),
              })}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="jq-btn jq-btn-primary"
            >
              {t("bookWith", { partner: offer.partnerName })} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
