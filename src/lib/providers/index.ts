import { mockFlightProvider, mockFulfillmentProvider, mockHotelProvider } from "./mock";
import { noPaymentProvider } from "./payment";
import type {
  FlightSearchProvider,
  FulfillmentProvider,
  HotelSearchProvider,
  PaymentProvider,
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
