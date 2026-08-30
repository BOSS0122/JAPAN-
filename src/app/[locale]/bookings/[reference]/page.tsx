import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPlace } from "@/data/places";
import { t as localized } from "@/lib/localized";
import { getBooking } from "@/lib/store";
import { DemoNotice } from "@/components/ui";
import { EtiquetteCards } from "@/components/EtiquetteCards";
import { getEtiquetteFor } from "@/data/etiquette";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; reference: string }>;
}) {
  const { locale, reference } = await params;
  setRequestLocale(locale);

  const booking = await getBooking(reference);
  if (!booking) notFound();

  const place = getPlace(booking.placeId);
  if (!place) notFound();

  const t = await getTranslations("booking");
  const tc = await getTranslations("common");
  const te = await getTranslations("etiquette");
  const placeName = localized(place.name, locale);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="jq-card overflow-hidden text-center">
        <div
          className="px-6 py-10"
          style={{
            backgroundImage: `linear-gradient(135deg, ${place.image.from}, ${place.image.to})`,
          }}
        >
          <p aria-hidden className="text-6xl">
            🎉
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-white drop-shadow-sm">
            {t("confirmed")}
          </h1>
        </div>

        <div className="space-y-5 p-6">
          <p className="text-base text-ink-soft">
            {t("confirmedBody", {
              party: tc("people", { count: booking.partySize }),
              name: placeName,
              date: booking.date,
              time: booking.time,
            })}
          </p>

          <div className="rounded-xl bg-cream px-4 py-3">
            <p className="jq-label mb-0">{t("reference")}</p>
            <p className="font-display text-2xl font-extrabold tracking-wider text-ink">
              {booking.reference}
            </p>
          </div>

          {booking.totalJpy > 0 && (
            <p className="text-sm font-bold text-ink">
              {t("total")}: ¥{booking.totalJpy.toLocaleString()}
            </p>
          )}

          <DemoNotice>{t("payNote")}</DemoNotice>

          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/explore" className="jq-btn jq-btn-accent">
              {t("backToExplore")}
            </Link>
            <Link href="/bookings" className="jq-btn jq-btn-ghost">
              {t("myBookings")}
            </Link>
          </div>
        </div>
      </div>

      {/* The moment this is actually read: they've committed to going. */}
      <EtiquetteCards
        rules={getEtiquetteFor(place, 4)}
        locale={locale}
        heading={te("beforeYouGo")}
      />
    </div>
  );
}
