import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlanClient } from "@/components/PlanClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plan" });
  return { title: t("title") };
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PlanClient />;
}
