/**
 * Adapter boundary for the external OTA integrations we do not hold contracts
 * for yet. The UI only ever talks to these interfaces, so swapping the mock for
 * Amadeus / Booking.com / Klook is a registry change, not a UI change.
 */

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
  cabin: "economy" | "premium" | "business";
}

export interface FlightOffer {
  id: string;
  partnerId: string;
  partnerName: string;
  airline: string;
  priceJpy: number;
  durationMinutes: number;
  stops: number;
  departTime: string;
  arriveTime: string;
  /** Affiliate hand-off URL. Placeholder until the partner deal is signed. */
  deepLink: string;
}

export interface HotelSearchQuery {
  areaKey: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export interface HotelOffer {
  id: string;
  partnerId: string;
  partnerName: string;
  hotelName: string;
  nightlyJpy: number;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  perks: string[];
  deepLink: string;
}

export interface FlightSearchProvider {
  id: string;
  name: string;
  search(query: FlightSearchQuery): Promise<FlightOffer[]>;
}

export interface HotelSearchProvider {
  id: string;
  name: string;
  search(query: HotelSearchQuery): Promise<HotelOffer[]>;
}
