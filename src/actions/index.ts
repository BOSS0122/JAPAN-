"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPlaceBySlug, listPlacesBySlugs } from "@/lib/repo/places";
import { bumpPlaceStat, commissionOn } from "@/lib/repo/revenue";
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
import { getDisplayName, getTravellerId, NAME_COOKIE, sanitiseName } from "@/lib/session";
import { enforce, LIMITS } from "@/lib/rate-limit";
import { assertSiteOpen } from "@/lib/gate";
import { CONSENT_COOKIE } from "@/lib/consent";
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
  await assertSiteOpen();
  await enforce("booking", LIMITS.booking, await getTravellerId());
  const place = await getPlaceBySlug(input.placeId);
  if (!place || !place.bookable) throw new Error("This place cannot be booked here");

  const partySize = Math.min(20, Math.max(1, Math.round(input.partySize)));
  const totalJpy = (place.priceFrom ?? 0) * partySize;

  const booking = await createBooking({
    placeId: place.id,
    travellerId: await getTravellerId(),
    date: input.date,
    time: input.time,
    partySize,
    name: input.name.trim().slice(0, 120),
    email: input.email.trim().slice(0, 200),
    requests: input.requests.trim().slice(0, 1000),
    totalJpy,
    // Frozen here: renegotiating the rate later must not rewrite past earnings.
    commissionJpy: commissionOn(totalJpy, place.commissionPct),
  });

  await bumpPlaceStat(place.id, {
    bookings: 1,
    grossJpy: totalJpy,
    commissionJpy: booking.commissionJpy,
  });

  redirect(`/${input.locale}/bookings/${booking.reference}`);
}

/**
 * Resolves a shortlist into full places. Client components ask for the handful
 * they need rather than shipping the whole catalogue to the browser.
 */
export async function loadPlacesAction(slugs: string[]) {
  return listPlacesBySlugs(slugs.slice(0, 60));
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
  await assertSiteOpen();
  await enforce("order", LIMITS.order, await getTravellerId());
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
    commissionJpy: commissionOn(itemJpy, product.commissionPct),
    partnerName: product.partnerName,
    etaDays: option.etaDays,
  });

  // Merchandise is attributed to the place whose story sold it.
  await bumpPlaceStat(product.placeId, {
    orders: 1,
    grossJpy: totalJpy,
    commissionJpy: order.commissionJpy,
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
  await assertSiteOpen();
  await enforce("createTrip", LIMITS.createTrip, await getTravellerId());
  const displayName = await getDisplayName();
  const trip = await createTrip({
    title: input.title.trim().slice(0, 120) || "Japan trip",
    ownerLabel: displayName ?? "Traveller",
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
  await assertSiteOpen();
  await enforce("tripEdit", LIMITS.tripEdit, await getTravellerId());
  await updateTrip(shareId, patch);
  revalidatePath(`/trips/${shareId}`, "page");
}

export async function addTripNoteAction(formData: FormData) {
  const shareId = String(formData.get("shareId") ?? "");
  const author = String(formData.get("author") ?? "");
  const body = String(formData.get("body") ?? "").slice(0, 500);
  if (!shareId || !body.trim()) return;
  await assertSiteOpen();
  await enforce("tripNote", LIMITS.tripNote, await getTravellerId());
  await addTripNote(shareId, author, body);
  revalidatePath(`/trips/${shareId}`, "page");
}

/**
 * Sets the name shown beside this traveller's notes on a shared itinerary.
 * A preference, not a sign-in: it authorises nothing, so it asks for nothing.
 */
export async function setDisplayNameAction(formData: FormData) {
  const name = sanitiseName(String(formData.get("name") ?? ""));
  const locale = String(formData.get("locale") ?? "en");
  const store = await cookies();

  if (!name) {
    store.delete(NAME_COOKIE);
  } else {
    store.set(NAME_COOKIE, name, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  redirect(`/${locale}/you`);
}

export async function clearDisplayNameAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  (await cookies()).delete(NAME_COOKIE);
  redirect(`/${locale}/you`);
}

/** Records the measurement choice. Either answer is a decision, so both are stored. */
export async function setConsentAction(choice: "granted" | "declined") {
  (await cookies()).set(CONSENT_COOKIE, choice, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
  });
  revalidatePath("/", "layout");
}
