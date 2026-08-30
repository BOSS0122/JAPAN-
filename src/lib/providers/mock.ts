import type {
  FlightOffer,
  FlightSearchProvider,
  FlightSearchQuery,
  HotelOffer,
  HotelSearchProvider,
  HotelSearchQuery,
} from "./types";

/** Stable pseudo-random so repeated searches don't reshuffle under the user. */
function seedFrom(input: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const AIRLINES = [
  "ANA",
  "Japan Airlines",
  "Zipair",
  "Peach Aviation",
  "Thai Airways",
  "Singapore Airlines",
];

const FLIGHT_PARTNERS = [
  { id: "amadeus", name: "Amadeus" },
  { id: "skyscanner", name: "Skyscanner" },
  { id: "trip-com", name: "Trip.com" },
];

export const mockFlightProvider: FlightSearchProvider = {
  id: "mock-flights",
  name: "Mock flight aggregator",
  async search(query: FlightSearchQuery): Promise<FlightOffer[]> {
    const rand = seedFrom(
      `${query.origin}${query.destination}${query.departDate}${query.cabin}`,
    );
    const cabinMultiplier = { economy: 1, premium: 1.7, business: 2.9 }[query.cabin];

    return Array.from({ length: 6 }, (_, i) => {
      const partner = FLIGHT_PARTNERS[i % FLIGHT_PARTNERS.length];
      const stops = i < 2 ? 0 : rand() > 0.5 ? 1 : 2;
      const duration = 330 + stops * 160 + Math.floor(rand() * 90);
      const departHour = 7 + Math.floor(rand() * 13);
      const arriveMinutes = departHour * 60 + duration;
      const base = 42000 + stops * -6000 + Math.floor(rand() * 34000);

      return {
        id: `flight-${i}`,
        partnerId: partner.id,
        partnerName: partner.name,
        airline: AIRLINES[Math.floor(rand() * AIRLINES.length)],
        priceJpy: Math.round((base * cabinMultiplier * query.passengers) / 100) * 100,
        durationMinutes: duration,
        stops,
        departTime: `${String(departHour).padStart(2, "0")}:${rand() > 0.5 ? "35" : "05"}`,
        arriveTime: `${String(Math.floor(arriveMinutes / 60) % 24).padStart(2, "0")}:${String(
          arriveMinutes % 60,
        ).padStart(2, "0")}`,
        // TODO(production): replace with the signed affiliate deep link.
        deepLink: `https://example-partner.invalid/${partner.id}/flights?from=${query.origin}&to=${query.destination}&date=${query.departDate}&pax=${query.passengers}`,
      } satisfies FlightOffer;
    }).sort((a, b) => a.priceJpy - b.priceJpy);
  },
};

const HOTEL_PARTNERS = [
  { id: "booking", name: "Booking.com" },
  { id: "agoda", name: "Agoda" },
  { id: "rakuten-travel", name: "Rakuten Travel" },
  { id: "klook", name: "Klook" },
];

const HOTEL_STYLES = [
  "Capsule & Sauna",
  "Machiya Townhouse",
  "Business Hotel",
  "Onsen Ryokan",
  "Design Hostel",
  "City Tower Hotel",
];

const PERKS = [
  "free-cancellation",
  "breakfast-included",
  "near-station",
  "luggage-forwarding",
  "onsen",
  "family-room",
];

export const mockHotelProvider: HotelSearchProvider = {
  id: "mock-hotels",
  name: "Mock hotel aggregator",
  async search(query: HotelSearchQuery): Promise<HotelOffer[]> {
    const rand = seedFrom(`${query.areaKey}${query.checkIn}${query.checkOut}${query.guests}`);

    return Array.from({ length: 6 }, (_, i) => {
      const partner = HOTEL_PARTNERS[i % HOTEL_PARTNERS.length];
      const style = HOTEL_STYLES[Math.floor(rand() * HOTEL_STYLES.length)];
      return {
        id: `hotel-${i}`,
        partnerId: partner.id,
        partnerName: partner.name,
        hotelName: `${style} ${query.areaKey.charAt(0).toUpperCase()}${query.areaKey.slice(1)} ${i + 1}`,
        nightlyJpy: Math.round((7800 + rand() * 26000) * query.rooms / 100) * 100,
        rating: Number((7.4 + rand() * 2.5).toFixed(1)),
        reviewCount: 120 + Math.floor(rand() * 3800),
        distanceKm: Number((0.2 + rand() * 3.4).toFixed(1)),
        perks: PERKS.filter(() => rand() > 0.55).slice(0, 3),
        // TODO(production): replace with the signed affiliate deep link.
        deepLink: `https://example-partner.invalid/${partner.id}/hotels?area=${query.areaKey}&in=${query.checkIn}&out=${query.checkOut}&guests=${query.guests}`,
      } satisfies HotelOffer;
    }).sort((a, b) => a.nightlyJpy - b.nightlyJpy);
  },
};
