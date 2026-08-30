import { mockFlightProvider, mockHotelProvider } from "./mock";
import type { FlightSearchProvider, HotelSearchProvider } from "./types";

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

export function getHotelProvider(): HotelSearchProvider {
  const key = process.env.HOTEL_PROVIDER ?? "mock";
  return hotelProviders[key] ?? mockHotelProvider;
}

export const usingMockProviders =
  (process.env.FLIGHT_PROVIDER ?? "mock") === "mock";
