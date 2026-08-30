import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPlaceBySlug } from "@/lib/repo/places";
import { t as localized } from "@/lib/localized";
import { BookingFlow } from "@/components/BookingFlow";
import { SectionHeading } from "@/components/ui";

export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const place = await getPlaceBySlug(id);
  if (!place) notFound();

  const t = await getTranslations("booking");

  if (!place.bookable) {
    return (
      <div className="jq-card p-8 text-center">
        <p className="text-ink-soft">{t("notBookable")}</p>
        <Link href={`/places/${place.id}`} className="jq-btn jq-btn-ghost mt-4">
          ← {localized(place.name, locale)}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeading title={t("title", { name: localized(place.name, locale) })} />
      <BookingFlow place={place} />
    </div>
  );
}
