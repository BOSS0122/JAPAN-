import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/auth/editor";
import { getPlaceForAdmin } from "@/lib/repo/places";
import { PlaceForm } from "@/components/admin/PlaceForm";
import { draftingAvailable } from "@/lib/providers";

/**
 * `?from=<slug>` starts from an existing place.
 *
 * The fifth izakaya in one alley shares its area, coordinates to two decimals,
 * hours, tags and commission with the fourth; only its name and its story are
 * new. Copying those carries over the twenty fields nobody wants to retype
 * while deliberately leaving the prose blank, so nothing is copied that would
 * be wrong to publish.
 */
export default async function NewPlacePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  await requireEditor();

  const { from } = await searchParams;
  if (!from) return <PlaceForm draftingAvailable={draftingAvailable()} />;

  const template = await getPlaceForAdmin(from);
  if (!template) notFound();

  const ja = template.translations.find((t) => t.locale === "ja");

  return (
    <PlaceForm
      draftingAvailable={draftingAvailable()}
      copiedFrom={ja?.name || template.slug}
      row={{
        ...template,
        slug: "",
        // A copy starts unpublished, whatever the original was.
        status: "draft",
        // Area labels carry over; names and descriptions must not.
        translations: template.translations.map((t) => ({
          locale: t.locale,
          name: "",
          description: "",
          area: t.area,
        })),
      }}
    />
  );
}
