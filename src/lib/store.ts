import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { StaminaLevel } from "./route-planner";

/**
 * Prototype persistence: a single JSON file behind an async mutex. Swapping in
 * Prisma/SQLite means reimplementing this module's exported functions only.
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
  createdAt: string;
}

export interface Visit {
  travellerId: string;
  placeId: string;
  visitedAt: string;
}

interface Database {
  trips: Trip[];
  bookings: Booking[];
  visits: Visit[];
}

const DB_PATH = path.join(process.cwd(), ".data", "db.json");
const EMPTY: Database = { trips: [], bookings: [], visits: [] };

type Cache = { db: Database | null; queue: Promise<unknown> };
const globalCache = globalThis as unknown as { __jqStore?: Cache };
const cache: Cache = (globalCache.__jqStore ??= { db: null, queue: Promise.resolve() });

async function read(): Promise<Database> {
  if (cache.db) return cache.db;
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    cache.db = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    cache.db = structuredClone(EMPTY);
  }
  return cache.db!;
}

async function write(db: Database): Promise<void> {
  cache.db = db;
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

/** Serializes read-modify-write so two concurrent requests can't clobber each other. */
function transaction<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const next = cache.queue.then(async () => {
    const db = await read();
    const result = await fn(db);
    await write(db);
    return result;
  });
  cache.queue = next.catch(() => undefined);
  return next;
}

export function newId(bytes = 8): string {
  return randomBytes(bytes).toString("hex");
}

export function newReference(): string {
  return `JQ-${randomBytes(3).toString("hex").toUpperCase()}`;
}

// ------------------------------------------------------------------ trips

export async function createTrip(
  input: Omit<Trip, "id" | "shareId" | "notes" | "createdAt" | "updatedAt">,
): Promise<Trip> {
  return transaction((db) => {
    const now = new Date().toISOString();
    const trip: Trip = {
      ...input,
      id: newId(),
      shareId: newId(12),
      notes: [],
      createdAt: now,
      updatedAt: now,
    };
    db.trips.push(trip);
    return trip;
  });
}

export async function getTripByShareId(shareId: string): Promise<Trip | null> {
  const db = await read();
  return db.trips.find((t) => t.shareId === shareId) ?? null;
}

export async function updateTrip(
  shareId: string,
  patch: Partial<Pick<Trip, "title" | "placeIds" | "days" | "stamina" | "accessibleOnly" | "startHour">>,
): Promise<Trip | null> {
  return transaction((db) => {
    const trip = db.trips.find((t) => t.shareId === shareId);
    if (!trip) return null;
    Object.assign(trip, patch, { updatedAt: new Date().toISOString() });
    return trip;
  });
}

export async function addTripNote(
  shareId: string,
  author: string,
  body: string,
): Promise<Trip | null> {
  return transaction((db) => {
    const trip = db.trips.find((t) => t.shareId === shareId);
    if (!trip) return null;
    trip.notes.push({
      id: newId(4),
      author: author.trim() || "Traveller",
      body: body.trim(),
      createdAt: new Date().toISOString(),
    });
    trip.updatedAt = new Date().toISOString();
    return trip;
  });
}

export async function listTrips(): Promise<Trip[]> {
  const db = await read();
  return [...db.trips].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// --------------------------------------------------------------- bookings

export async function createBooking(
  input: Omit<Booking, "id" | "reference" | "createdAt">,
): Promise<Booking> {
  return transaction((db) => {
    const booking: Booking = {
      ...input,
      id: newId(),
      reference: newReference(),
      createdAt: new Date().toISOString(),
    };
    db.bookings.push(booking);
    return booking;
  });
}

export async function getBooking(reference: string): Promise<Booking | null> {
  const db = await read();
  return db.bookings.find((b) => b.reference === reference) ?? null;
}

export async function listBookings(travellerId?: string): Promise<Booking[]> {
  const db = await read();
  return db.bookings
    .filter((b) => !travellerId || b.travellerId === travellerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ----------------------------------------------------------------- visits

export async function toggleVisit(travellerId: string, placeId: string): Promise<boolean> {
  return transaction((db) => {
    const index = db.visits.findIndex(
      (v) => v.travellerId === travellerId && v.placeId === placeId,
    );
    if (index >= 0) {
      db.visits.splice(index, 1);
      return false;
    }
    db.visits.push({ travellerId, placeId, visitedAt: new Date().toISOString() });
    return true;
  });
}

export async function listVisits(travellerId: string): Promise<Visit[]> {
  const db = await read();
  return db.visits.filter((v) => v.travellerId === travellerId);
}
