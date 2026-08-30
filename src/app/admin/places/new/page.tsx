import { requireEditor } from "@/lib/auth/editor";
import { PlaceForm } from "@/components/admin/PlaceForm";

export default async function NewPlacePage() {
  await requireEditor();
  return <PlaceForm />;
}
