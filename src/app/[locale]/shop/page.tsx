import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { products } from "@/data/commerce";
import { getPlace } from "@/data/places";
import { t as localized } from "@/lib/localized";
import { SectionHeading } from "@/components/ui";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return { title: t("title") };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shop");

  return (
    <div className="space-y-8">
      <SectionHeading title={t("title")} sub={t("subtitle")} />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="jq-card p-5">
          <span aria-hidden className="text-2xl">
            🌏
          </span>
          <h2 className="mt-2 font-display text-lg font-extrabold text-ink">
            {t("shipTitle")}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{t("shipBody")}</p>
        </div>
        <div className="jq-card border-2 border-berry p-5">
          <span aria-hidden className="text-2xl">
            🧳
          </span>
          <h2 className="mt-2 font-display text-lg font-extrabold text-ink">
            {t("pickupTitle")}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{t("pickupBody")}</p>
        </div>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const place = getPlace(product.placeId);
          const pickupOnly = !product.modes.includes("ship-international");
          return (
            <li key={product.id} className="jq-card flex flex-col overflow-hidden">
              <Link href={`/shop/${product.id}`} className="block">
                <div
                  className="relative grid h-36 place-items-center"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${product.image.from}, ${product.image.to})`,
                  }}
                >
                  <span aria-hidden className="text-5xl drop-shadow-sm">
                    {product.image.emoji}
                  </span>
                  {pickupOnly && (
                    <span className="absolute left-3 top-3 jq-chip bg-white/90 text-ink">
                      🧳 {t("pickupOnly")}
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-display text-base font-extrabold leading-snug text-ink">
                  <Link href={`/shop/${product.id}`} className="hover:text-grape">
                    {localized(product.name, locale)}
                  </Link>
                </h3>
                {place && (
                  <p className="text-xs font-semibold text-ink-soft">
                    {t("fromPlace", { place: localized(place.name, locale) })}
                  </p>
                )}
                <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">
                  {localized(product.description, locale)}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
                  <span className="font-display text-lg font-extrabold text-berry">
                    ¥{product.priceJpy.toLocaleString()}
                  </span>
                  <Link href={`/shop/${product.id}`} className="jq-btn jq-btn-ghost jq-chip">
                    {t("view")} →
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
