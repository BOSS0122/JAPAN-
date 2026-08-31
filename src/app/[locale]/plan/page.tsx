import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlanClient } from "@/components/PlanClient";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plan" });
  return { title: t("title"), alternates: localeAlternates(locale, "/plan") };
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
