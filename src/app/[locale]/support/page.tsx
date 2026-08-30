import { getTranslations, setRequestLocale } from "next-intl/server";
import { SupportClient } from "@/components/SupportClient";
import { SectionHeading } from "@/components/ui";

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("support");

  return (
    <div className="space-y-6">
      <SectionHeading title={t("title")} sub={t("subtitle")} />
      <SupportClient />
    </div>
  );
}
