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

/**
 * Merchandise fulfilment. We never hold stock: a partner either ships the item
 * (Phase A) or stages it for collection during the trip (Phase B). Swapping in
 * a real 3PL or each partner's own logistics is an adapter, not a rewrite.
 */
export interface FulfillmentQuery {
  productId: string;
  /** Areas on the traveller's itinerary, so collection points can be ranked. */
  areaKeys: string[];
}

export interface FulfillmentOption {
  id: string;
  mode: "ship-international" | "pickup-in-japan";
  partnerName: string;
  feeJpy: number;
  etaDays: number;
  /** Set for pickup options; indexes into `pickupPoints`. */
  pickupPointId?: string;
  /** True when this collection point sits on the traveller's route. */
  onRoute?: boolean;
}

export interface FulfillmentProvider {
  id: string;
  name: string;
  quote(query: FulfillmentQuery): Promise<FulfillmentOption[]>;
}

/**
 * Taking money.
 *
 * Kept behind an interface like the OTA integrations, for the same reason:
 * nobody should have to edit an action to change payment processor. The
 * difference is that this one has a `live` flag the application checks, because
 * an order that says "confirmed" while charging nothing is not a demo detail —
 * it is a traveller believing they have bought something.
 */
export interface PaymentRequest {
  /** Whole yen. JPY has no minor unit, so this is never multiplied by 100. */
  amountJpy: number;
  /** Our reference, so a provider's dashboard and ours can be reconciled. */
  reference: string;
  description: string;
  email: string;
  locale: string;
  /** Where the provider returns the traveller after an off-site step. */
  returnUrl: string;
}

export interface PaymentResult {
  /** The provider's own id for this charge. */
  id: string;
  status: "paid" | "requires_action" | "failed";
  /** Present when the traveller must complete the payment elsewhere. */
  redirectUrl?: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  /**
   * Whether this provider can actually move money. The application refuses
   * paid transactions once launched unless something here says true.
   */
  readonly live: boolean;
  charge(request: PaymentRequest): Promise<PaymentResult>;
}
