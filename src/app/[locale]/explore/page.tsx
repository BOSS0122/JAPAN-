import { getTranslations, setRequestLocale } from "next-intl/server";
import { currentSeason, getWeather } from "@/lib/season";
import { listPlaces } from "@/lib/repo/places";
import { ExploreClient } from "@/components/ExploreClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "explore" });
  return { title: t("title") };
}

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const places = await listPlaces();

  return (
    <ExploreClient
      places={places}
      season={currentSeason()}
      weather={getWeather("tokyo").weather}
    />
  );
}
