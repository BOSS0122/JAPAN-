import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pickupPointById, productById } from "@/data/commerce";
import { t as localized } from "@/lib/localized";
import { getTravellerId } from "@/lib/session";
import { listOrders } from "@/lib/store";
import { SectionHeading } from "@/components/ui";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("shop");
  const orders = await listOrders(await getTravellerId());

  return (
    <div className="space-y-6">
      <SectionHeading title={t("myOrders")} />

      {orders.length === 0 ? (
        <div className="jq-card p-10 text-center">
          <p className="text-sm text-ink-soft">{t("noOrders")}</p>
          <Link href="/shop" className="jq-btn jq-btn-accent mt-4">
            {t("backToShop")} →
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const product = productById.get(order.productId);
            if (!product) return null;
            const point = order.pickupPointId ? pickupPointById.get(order.pickupPointId) : null;
            return (
              <li key={order.id} className="jq-card flex flex-col gap-2 p-5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${product.image.from}, ${product.image.to})`,
                    }}
                  >
                    {product.image.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-extrabold text-ink">
                      <Link href={`/shop/${product.id}`} className="hover:text-grape">
                        {localized(product.name, locale)}
                      </Link>
                    </p>
                    <p className="text-xs text-ink-soft">× {order.quantity}</p>
                  </div>
                </div>

                <p className="text-sm font-bold text-berry">
                  {order.mode === "ship-international"
                    ? `🌏 ${t("shipInternational")} · ${order.destinationCountry ?? ""}`
                    : `🧳 ${point ? localized(point.name, locale) : t("pickupInJapan")}`}
                </p>
                <p className="text-sm font-bold text-ink">¥{order.totalJpy.toLocaleString()}</p>

                <Link
                  href={`/orders/${order.reference}`}
                  className="mt-auto text-sm font-bold text-grape hover:underline"
                >
                  {t("orderRef")}: {order.reference} →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
