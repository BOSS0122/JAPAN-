import { mockFlightProvider, mockFulfillmentProvider, mockHotelProvider } from "./mock";
import { noPaymentProvider } from "./payment";
import { localMoodProvider } from "./mood-local";
import type {
  FlightSearchProvider,
  FulfillmentProvider,
  HotelSearchProvider,
  MoodSearchProvider,
  PaymentProvider,
  PlaceDraftProvider,
} from "./types";

export * from "./types";

/**
 * Registry. Set OTA_PROVIDER=amadeus (etc.) and register the real adapter here
 * once the partner contract is in place; nothing else in the app changes.
 */
const flightProviders: Record<string, FlightSearchProvider> = {
  mock: mockFlightProvider,
};

const hotelProviders: Record<string, HotelSearchProvider> = {
  mock: mockHotelProvider,
};

export function getFlightProvider(): FlightSearchProvider {
  const key = process.env.FLIGHT_PROVIDER ?? "mock";
  return flightProviders[key] ?? mockFlightProvider;
}

const fulfillmentProviders: Record<string, FulfillmentProvider> = {
  mock: mockFulfillmentProvider,
};

export function getHotelProvider(): HotelSearchProvider {
  const key = process.env.HOTEL_PROVIDER ?? "mock";
  return hotelProviders[key] ?? mockHotelProvider;
}

export function getFulfillmentProvider(): FulfillmentProvider {
  const key = process.env.FULFILLMENT_PROVIDER ?? "mock";
  return fulfillmentProviders[key] ?? mockFulfillmentProvider;
}

export const usingMockProviders =
  (process.env.FLIGHT_PROVIDER ?? "mock") === "mock";

const paymentProviders: Record<string, PaymentProvider> = {
  none: noPaymentProvider,
};

export function getPaymentProvider(): PaymentProvider {
  const key = process.env.PAYMENT_PROVIDER ?? "none";
  return paymentProviders[key] ?? noPaymentProvider;
}

/** Whether money can actually be taken. Checked before every paid transaction. */
export function paymentsLive(): boolean {
  return getPaymentProvider().live;
}

/**
 * Mood search. The Claude adapter is imported lazily: it pulls in the SDK, and
 * a deployment running without a key should not carry it into every bundle.
 */
export async function getMoodProvider(): Promise<MoodSearchProvider> {
  if (process.env.MOOD_PROVIDER === "claude" && hasAnthropicCredentials()) {
    const { claudeMoodProvider } = await import("./mood-claude");
    return claudeMoodProvider;
  }
  return localMoodProvider;
}

/** The SDK also accepts an auth token, so a missing API key is not the whole test. */
export function hasAnthropicCredentials(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export function moodSearchIsSemantic(): boolean {
  return process.env.MOOD_PROVIDER === "claude" && hasAnthropicCredentials();
}

/**
 * Drafting has no offline implementation on purpose: a template cannot write,
 * and inventing prose without a model would mean inventing facts. Unset, the
 * console says so and the editor types.
 */
export async function getDraftProvider(): Promise<PlaceDraftProvider | null> {
  if (process.env.DRAFT_PROVIDER === "claude" && hasAnthropicCredentials()) {
    const { claudeDraftProvider } = await import("./draft-claude");
    return claudeDraftProvider;
  }
  return null;
}

export function draftingAvailable(): boolean {
  return process.env.DRAFT_PROVIDER === "claude" && hasAnthropicCredentials();
}
