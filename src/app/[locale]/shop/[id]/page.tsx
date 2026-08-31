import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { products, productById } from "@/data/commerce";
import { getPlaceBySlug } from "@/lib/repo/places";
import { t as localized } from "@/lib/localized";
import { PlaceCard } from "@/components/PlaceCard";
import { ProductPurchase } from "@/components/ProductPurchase";
import { localeAlternates } from "@/lib/seo";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const product = productById.get(id);
  if (!product) return {};
  return {
    alternates: localeAlternates(locale, `/shop/${id}`),
    title: localized(product.name, locale),
    description: localized(product.description, locale),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const product = productById.get(id);
  if (!product) notFound();

  const place = await getPlaceBySlug(product.placeId);
  const t = await getTranslations("shop");
  const ttax = await getTranslations("taxfree");

  return (
    <div className="space-y-8">
      <Link href="/shop" className="jq-btn jq-btn-ghost jq-chip">
        ← {t("backToShop")}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-6">
          <div
            className="jq-card grid h-64 place-items-center overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(135deg, ${product.image.from}, ${product.image.to})`,
            }}
          >
            <span aria-hidden className="text-7xl drop-shadow">
              {product.image.emoji}
            </span>
          </div>

          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">
              {localized(product.name, locale)}
            </h1>
            {place && (
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                {t("fromPlace", { place: localized(place.name, locale) })} ·{" "}
                {localized(place.area, locale)}
              </p>
            )}
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              {localized(product.description, locale)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="jq-chip bg-cream text-ink-soft">
              🏷 {t("soldBy", { partner: product.partnerName })}
            </span>
            {product.taxFreeEligible && (
              <span className="jq-chip bg-matcha-soft text-matcha">🧾 {t("taxFree")}</span>
            )}
            {product.fragile && <span className="jq-chip bg-cream text-ink-soft">🫙</span>}
          </div>

          {product.restriction && (
            <div className="rounded-xl bg-sunshine-soft px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#8a5b00]">
                {t("restriction")}
              </p>
              <p className="mt-1 text-sm text-[#7a5200]">
                {localized(product.restriction, locale)}
              </p>
            </div>
          )}

          {product.taxFreeEligible && (
            <p className="text-xs text-ink-soft">{ttax("rules")}</p>
          )}

          {place && (
            <section>
              <h2 className="mb-3 font-display text-xl font-extrabold text-ink">
                {t("relatedPlace")}
              </h2>
              <div className="sm:max-w-xs">
                <PlaceCard place={place} />
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24">
          <p className="mb-3 font-display text-3xl font-extrabold text-berry">
            ¥{product.priceJpy.toLocaleString()}
          </p>
          <ProductPurchase product={product} />
        </aside>
      </div>
    </div>
  );
}
