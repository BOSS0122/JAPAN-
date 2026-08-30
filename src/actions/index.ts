"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPlace } from "@/data/places";
import { productById } from "@/data/commerce";
import { getFulfillmentProvider } from "@/lib/providers";
import {
  addTripNote,
  createBooking,
  createOrder,
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

/** Quoting stays server-side so pricing lives in one place: the provider. */
export async function quoteFulfillmentAction(productId: string, areaKeys: string[]) {
  return getFulfillmentProvider().quote({ productId, areaKeys });
}

export interface OrderInput {
  productId: string;
  quantity: number;
  /** Option id from the fulfilment quote; re-quoted server-side before use. */
  optionId: string;
  areaKeys: string[];
  name: string;
  email: string;
  destinationCountry: string;
  hotelName: string;
  locale: string;
}

export async function createOrderAction(input: OrderInput) {
  const product = productById.get(input.productId);
  if (!product) throw new Error("Unknown product");

  // Never trust the client's price: re-quote and match the chosen option.
  const options = await getFulfillmentProvider().quote({
    productId: product.id,
    areaKeys: input.areaKeys,
  });
  const option = options.find((o) => o.id === input.optionId);
  if (!option) throw new Error("That fulfilment option is no longer available");

  const quantity = Math.min(10, Math.max(1, Math.round(input.quantity)));
  const itemJpy = product.priceJpy * quantity;
  const totalJpy = itemJpy + option.feeJpy;

  const order = await createOrder({
    travellerId: await getTravellerId(),
    productId: product.id,
    quantity,
    mode: option.mode,
    pickupPointId: option.pickupPointId,
    destinationCountry:
      option.mode === "ship-international" ? input.destinationCountry.trim().slice(0, 80) : undefined,
    hotelName:
      option.pickupPointId?.startsWith("hotel-") ? input.hotelName.trim().slice(0, 120) : undefined,
    name: input.name.trim().slice(0, 120),
    email: input.email.trim().slice(0, 200),
    itemJpy,
    feeJpy: option.feeJpy,
    totalJpy,
    commissionJpy: Math.round((itemJpy * product.commissionPct) / 100),
    partnerName: product.partnerName,
    etaDays: option.etaDays,
  });

  redirect(`/${input.locale}/orders/${order.reference}`);
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
