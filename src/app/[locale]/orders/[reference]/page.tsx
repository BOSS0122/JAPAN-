import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pickupPointById, productById } from "@/data/commerce";
import { getPlaceBySlug } from "@/lib/repo/places";
import { t as localized } from "@/lib/localized";
import { getOrder } from "@/lib/store";
import { DemoNotice } from "@/components/ui";
import { EtiquetteCards } from "@/components/EtiquetteCards";
import { getEtiquetteFor } from "@/data/etiquette";


/** Personal to one traveller: never indexed, however it is linked. */
export function generateMetadata() {
  return { robots: { index: false, follow: false } };
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; reference: string }>;
}) {
  const { locale, reference } = await params;
  setRequestLocale(locale);

  const order = await getOrder(reference);
  if (!order) notFound();

  const product = productById.get(order.productId);
  if (!product) notFound();

  const place = await getPlaceBySlug(product.placeId);
  const point = order.pickupPointId ? pickupPointById.get(order.pickupPointId) : null;
  const t = await getTranslations("shop");
  const te = await getTranslations("etiquette");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="jq-card overflow-hidden text-center">
        <div
          className="px-6 py-10"
          style={{
            backgroundImage: `linear-gradient(135deg, ${product.image.from}, ${product.image.to})`,
          }}
        >
          <p aria-hidden className="text-6xl">
            📦
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-white drop-shadow-sm">
            {t("orderPlaced")}
          </h1>
        </div>

        <div className="space-y-5 p-6">
          <p className="text-base text-ink-soft">
            {order.mode === "ship-international"
              ? t("orderShipBody", {
                  partner: order.partnerName,
                  country: order.destinationCountry ?? "",
                  days: order.etaDays,
                })
              : t("orderPickupBody", {
                  point: point ? localized(point.name, locale) : "",
                  days: order.etaDays,
                })}
          </p>

          {order.hotelName && (
            <p className="text-sm font-bold text-ink">🏨 {order.hotelName}</p>
          )}

          <div className="rounded-xl bg-cream px-4 py-3">
            <p className="jq-label mb-0">{t("orderRef")}</p>
            <p className="font-display text-2xl font-extrabold tracking-wider text-ink">
              {order.reference}
            </p>
          </div>

          <dl className="mx-auto max-w-sm space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">{localized(product.name, locale)} × {order.quantity}</dt>
              <dd className="font-bold text-ink">¥{order.itemJpy.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">{t("fulfillmentFee")}</dt>
              <dd className="font-bold text-ink">
                {order.feeJpy === 0 ? t("free") : `¥${order.feeJpy.toLocaleString()}`}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2">
              <dt className="font-display font-extrabold text-ink">{t("orderTotal")}</dt>
              <dd className="font-display text-lg font-extrabold text-berry">
                ¥{order.totalJpy.toLocaleString()}
              </dd>
            </div>
          </dl>

          <DemoNotice>{t("payNote")}</DemoNotice>

          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/shop" className="jq-btn jq-btn-accent">
              {t("backToShop")}
            </Link>
            <Link href="/orders" className="jq-btn jq-btn-ghost">
              {t("myOrders")}
            </Link>
          </div>
        </div>
      </div>

      {place && (
        <EtiquetteCards
          rules={getEtiquetteFor(place, 2)}
          locale={locale}
          heading={te("title")}
          compact
        />
      )}
    </div>
  );
}
