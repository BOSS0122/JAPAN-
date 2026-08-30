import { getTranslations, setRequestLocale } from "next-intl/server";
import { SupportClient } from "@/components/SupportClient";
import { SectionHeading } from "@/components/ui";
import { EtiquetteCards } from "@/components/EtiquetteCards";
import { nationwideEtiquette } from "@/data/etiquette";

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("support");
  const te = await getTranslations("etiquette");

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <SectionHeading title={t("title")} sub={t("subtitle")} />
        <SupportClient />
      </div>

      {/* The rules that attach to no single place still need a home. */}
      <EtiquetteCards
        rules={nationwideEtiquette}
        locale={locale}
        heading={te("nationwide")}
      />
    </div>
  );
}
