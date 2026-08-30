"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { locales } from "@/i18n/routing";
import { INTEREST_TAGS } from "@/data/types";
import { ADMIN_COOKIE } from "@/lib/admin-session";

/**
 * Placeholder gate. A shared password in an env var is enough to keep the
 * editor console off the open internet while the catalogue is being built;
 * it is not a substitute for real accounts, roles and an audit trail.
 */
export async function isAdmin(): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export async function adminLoginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) redirect("/admin/login?error=1");

  (await cookies()).set(ADMIN_COOKIE, password, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  redirect("/admin/places");
}

export async function adminLogoutAction() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised");
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const int = (fd: FormData, key: string, fallback = 0) => {
  const n = Number(fd.get(key));
  return Number.isFinite(n) ? Math.round(n) : fallback;
};
const float = (fd: FormData, key: string) => {
  const n = Number(fd.get(key));
  return Number.isFinite(n) ? n : 0;
};
const bool = (fd: FormData, key: string) => fd.get(key) === "on";

/** Slugs are permanent ids: lowercase, hyphenated, never reused. */
function normaliseSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function savePlaceAction(formData: FormData) {
  await assertAdmin();

  const originalSlug = str(formData, "originalSlug");
  const slug = normaliseSlug(str(formData, "slug"));
  if (!slug) throw new Error("A slug is required");

  const scalars = {
    category: str(formData, "category") || "spot",
    areaKey: normaliseSlug(str(formData, "areaKey")) || "unassigned",
    prefecture: str(formData, "prefecture"),
    famous: bool(formData, "famous"),
    lat: float(formData, "lat"),
    lng: float(formData, "lng"),
    stayMinutes: Math.max(5, int(formData, "stayMinutes", 60)),
    crowd: str(formData, "crowd") || "normal",
    indoor: bool(formData, "indoor"),
    accessible: bool(formData, "accessible"),
    openHour: Math.min(24, Math.max(0, int(formData, "openHour", 9))),
    closeHour: Math.min(24, Math.max(0, int(formData, "closeHour", 17))),
    priceFrom: str(formData, "priceFrom") ? int(formData, "priceFrom") : null,
    bookable: bool(formData, "bookable"),
    externalBookingUrl: str(formData, "externalBookingUrl") || null,
    mealSlot: str(formData, "mealSlot") || null,
    imageEmoji: str(formData, "imageEmoji") || "📍",
    imageFrom: str(formData, "imageFrom") || "#7c4dff",
    imageTo: str(formData, "imageTo") || "#0e9cb8",
    seasonSpring: Math.min(5, Math.max(0, int(formData, "seasonSpring", 3))),
    seasonSummer: Math.min(5, Math.max(0, int(formData, "seasonSummer", 3))),
    seasonAutumn: Math.min(5, Math.max(0, int(formData, "seasonAutumn", 3))),
    seasonWinter: Math.min(5, Math.max(0, int(formData, "seasonWinter", 3))),
    status: str(formData, "status") === "published" ? "published" : "draft",
    // Saving through the console is itself a confirmation of the record.
    verifiedAt: new Date(),
    source: "editor",
  };

  const place = originalSlug
    ? await prisma.place.update({ where: { slug: originalSlug }, data: { slug, ...scalars } })
    : await prisma.place.create({ data: { slug, ...scalars } });

  await prisma.placeTranslation.deleteMany({ where: { placeId: place.id } });
  await prisma.placeTranslation.createMany({
    data: locales.map((locale) => ({
      placeId: place.id,
      locale,
      name: str(formData, `name_${locale}`),
      description: str(formData, `description_${locale}`),
      area: str(formData, `area_${locale}`),
    })),
  });

  const tags = INTEREST_TAGS.filter((tag) => formData.get(`tag_${tag}`) === "on");
  await prisma.placeTag.deleteMany({ where: { placeId: place.id } });
  if (tags.length > 0) {
    await prisma.placeTag.createMany({
      data: tags.map((tag) => ({ placeId: place.id, tag })),
    });
  }

  // The traveller-facing pages read this catalogue, so clear their caches.
  revalidatePath("/", "layout");
  redirect(`/admin/places/${slug}?saved=1`);
}

export async function setPlaceStatusAction(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  const status = str(formData, "status") === "published" ? "published" : "draft";
  await prisma.place.update({ where: { slug }, data: { status } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/places");
}

export async function deletePlaceAction(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "originalSlug") || str(formData, "slug");
  await prisma.place.delete({ where: { slug } });
  revalidatePath("/", "layout");
  redirect("/admin/places");
}
