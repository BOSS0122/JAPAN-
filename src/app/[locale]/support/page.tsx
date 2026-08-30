import { getTranslations, setRequestLocale } from "next-intl/server";
import { partnerHref } from "@/lib/partner-link";
import { pipelineValueJpy } from "@/config/revenue";
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

  // Signed server-side: the client cannot mint a tracked link, which is the
  // point — an unsigned destination is never redirected to.
  const partnerLinks = Object.fromEntries(
    (
      [
        ["esim", "esim-partner", "Sakura Mobile", 4500],
        ["wifi", "wifi-partner", "Ninja WiFi", 6300],
        ["luggage", "luggage-partner", "Yamato Hands-Free", 2500],
      ] as const
    ).map(([key, partnerId, partnerName, typicalJpy]) => [
      key,
      partnerHref({
        url: `https://example-partner.invalid/${key}`,
        partnerId,
        partnerName,
        surface: "support",
        ref: key,
        estimatedValueJpy: pipelineValueJpy("support", typicalJpy),
      }),
    ]),
  ) as Record<"esim" | "wifi" | "luggage", string>;

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <SectionHeading title={t("title")} sub={t("subtitle")} />
        <SupportClient partnerLinks={partnerLinks} />
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
