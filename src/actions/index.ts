"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPlace } from "@/data/places";
import {
  addTripNote,
  createBooking,
  createTrip,
  toggleVisit,
  updateTrip,
} from "@/lib/store";
import { encodeUser, getTravellerId, getUser, USER_COOKIE } from "@/lib/session";
import type { StaminaLevel } from "@/lib/route-planner";

export async function toggleVisitAction(placeId: string) {
  const travellerId = await getTravellerId();
  const visited = await toggleVisit(travellerId, placeId);
  revalidatePath("/", "layout");
  return visited;
}

export interface BookingInput {
  placeId: string;
  date: string;
  time: string;
  partySize: number;
  name: string;
  email: string;
  requests: string;
  locale: string;
}

export async function createBookingAction(input: BookingInput) {
  const place = getPlace(input.placeId);
  if (!place || !place.bookable) throw new Error("This place cannot be booked here");

  const partySize = Math.min(20, Math.max(1, Math.round(input.partySize)));
  const booking = await createBooking({
    placeId: place.id,
    travellerId: await getTravellerId(),
    date: input.date,
    time: input.time,
    partySize,
    name: input.name.trim().slice(0, 120),
    email: input.email.trim().slice(0, 200),
    requests: input.requests.trim().slice(0, 1000),
    totalJpy: (place.priceFrom ?? 0) * partySize,
  });

  redirect(`/${input.locale}/bookings/${booking.reference}`);
}

export interface CreateTripInput {
  title: string;
  placeIds: string[];
  days: number;
  stamina: StaminaLevel;
  accessibleOnly: boolean;
  startHour: number;
  locale: string;
}

export async function createTripAction(input: CreateTripInput) {
  const user = await getUser();
  const trip = await createTrip({
    title: input.title.trim().slice(0, 120) || "Japan trip",
    ownerLabel: user?.name ?? "Traveller",
    placeIds: input.placeIds.slice(0, 40),
    days: input.days,
    stamina: input.stamina,
    accessibleOnly: input.accessibleOnly,
    startHour: input.startHour,
    locale: input.locale,
  });
  return trip.shareId;
}

export async function updateTripAction(
  shareId: string,
  patch: { title?: string; placeIds?: string[]; days?: number; stamina?: StaminaLevel; accessibleOnly?: boolean },
) {
  await updateTrip(shareId, patch);
  revalidatePath(`/trips/${shareId}`, "page");
}

export async function addTripNoteAction(formData: FormData) {
  const shareId = String(formData.get("shareId") ?? "");
  const author = String(formData.get("author") ?? "");
  const body = String(formData.get("body") ?? "").slice(0, 500);
  if (!shareId || !body.trim()) return;
  await addTripNote(shareId, author, body);
  revalidatePath(`/trips/${shareId}`, "page");
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim() || email.split("@")[0] || "Traveller";
  const locale = String(formData.get("locale") ?? "en");
  if (!email) return;

  // Placeholder auth: no password check, no server-side session store.
  const store = await cookies();
  store.set(USER_COOKIE, encodeUser({ email, name }), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  redirect(`/${locale}`);
}

export async function signOutAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const store = await cookies();
  store.delete(USER_COOKIE);
  redirect(`/${locale}`);
}
