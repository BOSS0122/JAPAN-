"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { locales } from "@/i18n/routing";
import { INTEREST_TAGS } from "@/data/types";
import {
  assertEditor,
  createSession,
  destroySession,
  revokeSessionsFor,
} from "@/lib/auth/editor";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import {
  describeChanges,
  NO_CHANGES,
  recordRevision,
  type PlaceSnapshot,
} from "@/lib/repo/revisions";

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
/** Colour inputs return lowercase; stored values may not. Without this the
 *  first save of any older record logs a change that nobody made. */
const hex = (fd: FormData, key: string, fallback: string) =>
  (str(fd, key) || fallback).toLowerCase();

// ------------------------------------------------------------------ sign in

export async function adminLoginAction(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  const editor = await prisma.editor.findUnique({ where: { email } });

  // One message for every failure. Telling an attacker that an address exists
  // is the difference between guessing a password and guessing a pair.
  const ok =
    editor !== null &&
    editor.status === "active" &&
    verifyPassword(password, editor.passwordHash);
  if (!ok) redirect("/admin/login?error=1");

  await prisma.editor.update({
    where: { id: editor.id },
    data: { lastLoginAt: new Date() },
  });
  await createSession(editor.id);
  redirect("/admin/places");
}

export async function adminLogoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function changeOwnPasswordAction(formData: FormData) {
  const me = await assertEditor();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");

  const row = await prisma.editor.findUniqueOrThrow({ where: { id: me.id } });
  if (!verifyPassword(current, row.passwordHash)) {
    redirect("/admin/account?error=current");
  }
  if (passwordProblem(next)) redirect("/admin/account?error=weak");

  await prisma.editor.update({
    where: { id: me.id },
    data: { passwordHash: hashPassword(next) },
  });
  // Other devices are signed out, then this one is signed back in.
  await revokeSessionsFor(me.id);
  await createSession(me.id);
  redirect("/admin/account?saved=1");
}

// ---------------------------------------------------------- editor accounts

export async function createEditorAction(formData: FormData) {
  await assertEditor("admin");

  const email = str(formData, "email").toLowerCase();
  const name = str(formData, "name");
  const password = String(formData.get("password") ?? "");
  const role = str(formData, "role") === "admin" ? "admin" : "editor";

  if (!/.+@.+\..+/.test(email)) redirect("/admin/editors?error=email");
  if (!name) redirect("/admin/editors?error=name");
  if (passwordProblem(password)) redirect("/admin/editors?error=weak");
  if (await prisma.editor.findUnique({ where: { email } })) {
    redirect("/admin/editors?error=duplicate");
  }

  await prisma.editor.create({
    data: { email, name, role, passwordHash: hashPassword(password) },
  });
  revalidatePath("/admin/editors");
  redirect("/admin/editors?created=1");
}

export async function setEditorRoleAction(formData: FormData) {
  const me = await assertEditor("admin");
  const id = str(formData, "id");
  const role = str(formData, "role") === "admin" ? "admin" : "editor";

  if (id === me.id) redirect("/admin/editors?error=self");
  await prisma.editor.update({ where: { id }, data: { role } });
  // A demotion must not leave an open session holding the old role.
  if (role !== "admin") await revokeSessionsFor(id);
  revalidatePath("/admin/editors");
}

export async function setEditorStatusAction(formData: FormData) {
  const me = await assertEditor("admin");
  const id = str(formData, "id");
  const status = str(formData, "status") === "active" ? "active" : "disabled";

  // Locking yourself out is the one mistake nobody in the room can undo.
  if (id === me.id) redirect("/admin/editors?error=self");

  await prisma.editor.update({ where: { id }, data: { status } });
  if (status !== "active") await revokeSessionsFor(id);
  revalidatePath("/admin/editors");
}

export async function resetEditorPasswordAction(formData: FormData) {
  await assertEditor("admin");
  const id = str(formData, "id");
  const password = String(formData.get("password") ?? "");
  if (passwordProblem(password)) redirect("/admin/editors?error=weak");

  await prisma.editor.update({ where: { id }, data: { passwordHash: hashPassword(password) } });
  await revokeSessionsFor(id);
  revalidatePath("/admin/editors");
  redirect("/admin/editors?reset=1");
}

// ------------------------------------------------------------------- places

/** Slugs are permanent ids: lowercase, hyphenated, never reused. */
function normaliseSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

type PlaceWithRelations = {
  slug: string;
  translations: { locale: string; name: string; description: string; area: string }[];
  tags: { tag: string }[];
} & Record<string, unknown>;

/** Only the fields the form can change, so the log never reports a timestamp. */
const TRACKED = Object.keys({
  slug: 0,
  category: 0,
  areaKey: 0,
  prefecture: 0,
  famous: 0,
  lat: 0,
  lng: 0,
  stayMinutes: 0,
  crowd: 0,
  indoor: 0,
  accessible: 0,
  openHour: 0,
  closeHour: 0,
  priceFrom: 0,
  bookable: 0,
  externalBookingUrl: 0,
  mealSlot: 0,
  imageEmoji: 0,
  imageFrom: 0,
  imageTo: 0,
  seasonSpring: 0,
  seasonSummer: 0,
  seasonAutumn: 0,
  seasonWinter: 0,
  status: 0,
});

const COLOUR_FIELDS = new Set(["imageFrom", "imageTo"]);

function snapshot(row: PlaceWithRelations): PlaceSnapshot {
  return {
    scalars: Object.fromEntries(
      TRACKED.map((key) => {
        const value = row[key] ?? null;
        return [key, COLOUR_FIELDS.has(key) && typeof value === "string" ? value.toLowerCase() : value];
      }),
    ),
    translations: Object.fromEntries(
      row.translations.map((t) => [
        t.locale,
        { name: t.name, description: t.description, area: t.area },
      ]),
    ),
    tags: row.tags.map((t) => t.tag).sort(),
  };
}

export async function savePlaceAction(formData: FormData) {
  const me = await assertEditor();

  const originalSlug = str(formData, "originalSlug");
  const slug = normaliseSlug(str(formData, "slug"));
  if (!slug) throw new Error("A slug is required");

  const scalars = {
    slug,
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
    imageFrom: hex(formData, "imageFrom", "#7c4dff"),
    imageTo: hex(formData, "imageTo", "#0e9cb8"),
    seasonSpring: Math.min(5, Math.max(0, int(formData, "seasonSpring", 3))),
    seasonSummer: Math.min(5, Math.max(0, int(formData, "seasonSummer", 3))),
    seasonAutumn: Math.min(5, Math.max(0, int(formData, "seasonAutumn", 3))),
    seasonWinter: Math.min(5, Math.max(0, int(formData, "seasonWinter", 3))),
    status: str(formData, "status") === "published" ? "published" : "draft",
    // Saving through the console is itself a confirmation of the record.
    verifiedAt: new Date(),
    source: me.email,
  };

  const before = originalSlug
    ? await prisma.place.findUnique({
        where: { slug: originalSlug },
        include: { translations: true, tags: true },
      })
    : null;

  const place = before
    ? await prisma.place.update({ where: { id: before.id }, data: scalars })
    : await prisma.place.create({ data: scalars });

  const translations = locales.map((locale) => ({
    placeId: place.id,
    locale,
    name: str(formData, `name_${locale}`),
    description: str(formData, `description_${locale}`),
    area: str(formData, `area_${locale}`),
  }));
  const tags = INTEREST_TAGS.filter((tag) => formData.get(`tag_${tag}`) === "on");

  await prisma.$transaction([
    prisma.placeTranslation.deleteMany({ where: { placeId: place.id } }),
    prisma.placeTranslation.createMany({ data: translations }),
    prisma.placeTag.deleteMany({ where: { placeId: place.id } }),
    prisma.placeTag.createMany({
      data: tags.map((tag) => ({ placeId: place.id, tag })),
    }),
  ]);

  const after: PlaceSnapshot = {
    scalars: Object.fromEntries(
      TRACKED.map((key) => [key, (scalars as Record<string, unknown>)[key] ?? null]),
    ),
    translations: Object.fromEntries(
      translations.map((t) => [t.locale, { name: t.name, description: t.description, area: t.area }]),
    ),
    tags: [...tags].sort(),
  };

  // A save that changed nothing is not an edit, and logging it would bury the
  // ones that were. Creates are always recorded.
  const summary = describeChanges(before ? snapshot(before) : null, after);
  if (!before || summary !== NO_CHANGES) {
    await recordRevision({
      placeSlug: slug,
      action: before ? "update" : "create",
      summary,
      editor: me,
    });
  }

  // The traveller-facing pages read this catalogue, so clear their caches.
  revalidatePath("/", "layout");
  redirect(`/admin/places/${slug}?saved=1`);
}

export async function setPlaceStatusAction(formData: FormData) {
  const me = await assertEditor();
  const slug = str(formData, "slug");
  const status = str(formData, "status") === "published" ? "published" : "draft";

  await prisma.place.update({ where: { slug }, data: { status } });
  await recordRevision({
    placeSlug: slug,
    action: status === "published" ? "publish" : "unpublish",
    summary: status === "published" ? "公開しました" : "下書きに戻しました",
    editor: me,
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/places");
}

export async function deletePlaceAction(formData: FormData) {
  // Deleting drops the traveller-facing record for good; admins only.
  const me = await assertEditor("admin");
  const slug = str(formData, "originalSlug") || str(formData, "slug");

  await prisma.place.delete({ where: { slug } });
  // The revision outlives the place, which is the point of an audit trail.
  await recordRevision({
    placeSlug: slug,
    action: "delete",
    summary: "削除しました",
    editor: me,
  });

  revalidatePath("/", "layout");
  redirect("/admin/places?deleted=1");
}
