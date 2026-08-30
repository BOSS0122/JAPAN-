import { redirect } from "next/navigation";
import { isAdmin } from "@/actions/admin";
import { PlaceForm } from "@/components/admin/PlaceForm";

export default async function NewPlacePage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <PlaceForm />;
}
