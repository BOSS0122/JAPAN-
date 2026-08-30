import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import type { StaminaLevel } from "./route-planner";

/**
 * Traveller-owned records: itineraries, bookings, orders and check-ins.
 *
 * The shapes below are what the rest of the app already speaks; only the
 * storage behind them changed from a JSON file to the database.
 */

export interface TripNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  /** Unguessable segment used by the invite link. */
  shareId: string;
  title: string;
  ownerLabel: string;
  placeIds: string[];
  days: number;
  stamina: StaminaLevel;
  accessibleOnly: boolean;
  startHour: number;
  locale: string;
  notes: TripNote[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  reference: string;
  placeId: string;
  travellerId: string;
  date: string;
  time: string;
  partySize: number;
  name: string;
  email: string;
  requests: string;
  totalJpy: number;
  /** Our earnings, frozen at the rate in force when the booking was made. */
  commissionJpy: number;
  createdAt: string;
}

export interface Order {
  id: string;
  reference: string;
  travellerId: string;
  productId: string;
  quantity: number;
  mode: "ship-international" | "pickup-in-japan";
  pickupPointId?: string;
  destinationCountry?: string;
  hotelName?: string;
  name: string;
  email: string;
  itemJpy: number;
  feeJpy: number;
  totalJpy: number;
  /** Our cut. Feeds the partner console. */
  commissionJpy: number;
  partnerName: string;
  etaDays: number;
  createdAt: string;
}

export interface Visit {
  travellerId: string;
  placeId: string;
  visitedAt: string;
}

export function newId(bytes = 8): string {
  return randomBytes(bytes).toString("hex");
}

export function newReference(): string {
  return `JQ-${randomBytes(3).toString("hex").toUpperCase()}`;
}

const iso = (d: Date) => d.toISOString();

// ------------------------------------------------------------------ trips

type TripRow = {
  id: string;
  shareId: string;
  title: string;
  ownerLabel: string;
  days: number;
  stamina: string;
  accessibleOnly: boolean;
  startHour: number;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
  stops: { placeSlug: string; position: number }[];
  notes: { id: string; author: string; body: string; createdAt: Date }[];
};

const TRIP_INCLUDE = {
  stops: { orderBy: { position: "asc" } },
  notes: { orderBy: { createdAt: "asc" } },
} as const;

function toTrip(row: TripRow): Trip {
  return {
    id: row.id,
    shareId: row.shareId,
    title: row.title,
    ownerLabel: row.ownerLabel,
    placeIds: row.stops.map((s) => s.placeSlug),
    days: row.days,
    stamina: row.stamina as StaminaLevel,
    accessibleOnly: row.accessibleOnly,
    startHour: row.startHour,
    locale: row.locale,
    notes: row.notes.map((n) => ({
      id: n.id,
      author: n.author,
      body: n.body,
      createdAt: iso(n.createdAt),
    })),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export async function createTrip(
  input: Omit<Trip, "id" | "shareId" | "notes" | "createdAt" | "updatedAt">,
): Promise<Trip> {
  const row = await prisma.trip.create({
    data: {
      shareId: newId(12),
      title: input.title,
      ownerLabel: input.ownerLabel,
      days: input.days,
      stamina: input.stamina,
      accessibleOnly: input.accessibleOnly,
      startHour: input.startHour,
      locale: input.locale,
      stops: {
        create: input.placeIds.map((placeSlug, position) => ({ placeSlug, position })),
      },
    },
    include: TRIP_INCLUDE,
  });
  return toTrip(row);
}

export async function getTripByShareId(shareId: string): Promise<Trip | null> {
  const row = await prisma.trip.findUnique({ where: { shareId }, include: TRIP_INCLUDE });
  return row ? toTrip(row) : null;
}

export async function updateTrip(
  shareId: string,
  patch: Partial<
    Pick<Trip, "title" | "placeIds" | "days" | "stamina" | "accessibleOnly" | "startHour">
  >,
): Promise<Trip | null> {
  const existing = await prisma.trip.findUnique({ where: { shareId }, select: { id: true } });
  if (!existing) return null;

  // Anyone with the link can write, so the stop list is replaced wholesale
  // inside a transaction rather than diffed against a stale client copy.
  const row = await prisma.$transaction(async (tx) => {
    if (patch.placeIds) {
      await tx.tripStop.deleteMany({ where: { tripId: existing.id } });
      await tx.tripStop.createMany({
        data: patch.placeIds.map((placeSlug, position) => ({
          tripId: existing.id,
          placeSlug,
          position,
        })),
      });
    }
    return tx.trip.update({
      where: { id: existing.id },
      data: {
        title: patch.title,
        days: patch.days,
        stamina: patch.stamina,
        accessibleOnly: patch.accessibleOnly,
        startHour: patch.startHour,
        updatedAt: new Date(),
      },
      include: TRIP_INCLUDE,
    });
  });

  return toTrip(row);
}

export async function addTripNote(
  shareId: string,
  author: string,
  body: string,
): Promise<Trip | null> {
  const existing = await prisma.trip.findUnique({ where: { shareId }, select: { id: true } });
  if (!existing) return null;

  await prisma.trip.update({
    where: { id: existing.id },
    data: {
      updatedAt: new Date(),
      notes: {
        create: { author: author.trim() || "Traveller", body: body.trim() },
      },
    },
  });

  return getTripByShareId(shareId);
}

export async function listTrips(): Promise<Trip[]> {
  const rows = await prisma.trip.findMany({
    include: TRIP_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toTrip);
}

// --------------------------------------------------------------- bookings

export async function createBooking(
  input: Omit<Booking, "id" | "reference" | "createdAt">,
): Promise<Booking> {
  const row = await prisma.booking.create({
    data: {
      reference: newReference(),
      placeSlug: input.placeId,
      travellerId: input.travellerId,
      date: input.date,
      time: input.time,
      partySize: input.partySize,
      name: input.name,
      email: input.email,
      requests: input.requests,
      totalJpy: input.totalJpy,
      commissionJpy: input.commissionJpy,
    },
  });
  return {
    ...input,
    id: row.id,
    reference: row.reference,
    createdAt: iso(row.createdAt),
  };
}

type BookingRow = {
  id: string;
  reference: string;
  placeSlug: string;
  travellerId: string;
  date: string;
  time: string;
  partySize: number;
  name: string;
  email: string;
  requests: string;
  totalJpy: number;
  commissionJpy: number;
  createdAt: Date;
};

const toBooking = (row: BookingRow): Booking => ({
  id: row.id,
  reference: row.reference,
  placeId: row.placeSlug,
  travellerId: row.travellerId,
  date: row.date,
  time: row.time,
  partySize: row.partySize,
  name: row.name,
  email: row.email,
  requests: row.requests,
  totalJpy: row.totalJpy,
  commissionJpy: row.commissionJpy,
  createdAt: iso(row.createdAt),
});

export async function getBooking(reference: string): Promise<Booking | null> {
  const row = await prisma.booking.findUnique({ where: { reference } });
  return row ? toBooking(row) : null;
}

export async function listBookings(travellerId?: string): Promise<Booking[]> {
  const rows = await prisma.booking.findMany({
    where: travellerId ? { travellerId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toBooking);
}

// ----------------------------------------------------------------- orders

export async function createOrder(
  input: Omit<Order, "id" | "reference" | "createdAt">,
): Promise<Order> {
  const row = await prisma.order.create({
    data: {
      reference: `JQ-S${randomBytes(3).toString("hex").toUpperCase()}`,
      travellerId: input.travellerId,
      productId: input.productId,
      quantity: input.quantity,
      mode: input.mode,
      pickupPointId: input.pickupPointId ?? null,
      destinationCountry: input.destinationCountry ?? null,
      hotelName: input.hotelName ?? null,
      name: input.name,
      email: input.email,
      itemJpy: input.itemJpy,
      feeJpy: input.feeJpy,
      totalJpy: input.totalJpy,
      commissionJpy: input.commissionJpy,
      partnerName: input.partnerName,
      etaDays: input.etaDays,
    },
  });
  return { ...input, id: row.id, reference: row.reference, createdAt: iso(row.createdAt) };
}

type OrderRow = Omit<
  Order,
  "createdAt" | "pickupPointId" | "destinationCountry" | "hotelName" | "mode"
> & {
  createdAt: Date;
  pickupPointId: string | null;
  destinationCountry: string | null;
  hotelName: string | null;
  mode: string;
};

const toOrder = (row: OrderRow): Order => ({
  ...row,
  mode: row.mode as Order["mode"],
  pickupPointId: row.pickupPointId ?? undefined,
  destinationCountry: row.destinationCountry ?? undefined,
  hotelName: row.hotelName ?? undefined,
  createdAt: iso(row.createdAt),
});

export async function getOrder(reference: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({ where: { reference } });
  return row ? toOrder(row) : null;
}

export async function listOrders(travellerId?: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: travellerId ? { travellerId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}

// ----------------------------------------------------------------- visits

/** Returns the new state, so the caller doesn't have to re-read. */
export async function toggleVisit(travellerId: string, placeId: string): Promise<boolean> {
  const existing = await prisma.visit.findUnique({
    where: { travellerId_placeSlug: { travellerId, placeSlug: placeId } },
  });
  if (existing) {
    await prisma.visit.delete({
      where: { travellerId_placeSlug: { travellerId, placeSlug: placeId } },
    });
    return false;
  }
  await prisma.visit.create({ data: { travellerId, placeSlug: placeId } });
  return true;
}

export async function listVisits(travellerId: string): Promise<Visit[]> {
  const rows = await prisma.visit.findMany({ where: { travellerId } });
  return rows.map((r) => ({
    travellerId: r.travellerId,
    placeId: r.placeSlug,
    visitedAt: iso(r.visitedAt),
  }));
}
