import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listPlacesBySlugs } from "@/lib/repo/places";
import { t as localized } from "@/lib/localized";
import { getTravellerId } from "@/lib/session";
import { listBookings } from "@/lib/store";
import { SectionHeading } from "@/components/ui";


/** Personal to one traveller: never indexed, however it is linked. */
export function generateMetadata() {
  return { robots: { index: false, follow: false } };
}

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("booking");
  const tc = await getTranslations("common");
  const bookings = await listBookings(await getTravellerId());
  const places = await listPlacesBySlugs([...new Set(bookings.map((b) => b.placeId))]);
  const placeBySlug = new Map(places.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <SectionHeading title={t("myBookings")} />

      {bookings.length === 0 ? (
        <div className="jq-card p-10 text-center">
          <p className="text-sm text-ink-soft">{t("noBookings")}</p>
          <Link href="/explore" className="jq-btn jq-btn-accent mt-4">
            {t("backToExplore")} →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => {
            const place = placeBySlug.get(booking.placeId);
            if (!place) return null;
            return (
              <li key={booking.id} className="jq-card flex flex-col gap-2 p-5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${place.image.from}, ${place.image.to})`,
                    }}
                  >
                    {place.image.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-extrabold text-ink">
                      <Link href={`/places/${place.id}`} className="hover:text-grape">
                        {localized(place.name, locale)}
                      </Link>
                    </p>
                    <p className="text-xs text-ink-soft">{localized(place.area, locale)}</p>
                  </div>
                </div>

                <p className="text-sm font-bold text-berry">
                  {booking.date} · {booking.time} · {tc("people", { count: booking.partySize })}
                </p>

                <Link
                  href={`/bookings/${booking.reference}`}
                  className="mt-auto text-sm font-bold text-grape hover:underline"
                >
                  {t("reference")}: {booking.reference} →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
