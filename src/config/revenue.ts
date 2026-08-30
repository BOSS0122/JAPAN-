/**
 * Every revenue assumption in one file.
 *
 * These are placeholders standing in for contract terms we do not have yet.
 * They are here, named and together, so that signing a deal is editing one
 * line rather than hunting rates through the codebase — and so nobody mistakes
 * a guess for a negotiated rate.
 */

/** Share of the transaction a partner pays us, as a fraction. */
export const AFFILIATE_RATES: Record<string, number> = {
  flight: 0.01,
  hotel: 0.04,
  "place-booking": 0.08,
  support: 0.1,
};

/** Applied to a new place until an editor sets its own. */
export const DEFAULT_BOOKING_COMMISSION_PCT = 10;

/**
 * What a hand-off is worth if it converts. A click is not a sale, so this
 * feeds a pipeline figure and never an invoice.
 */
export function pipelineValueJpy(surface: string, grossJpy: number): number {
  return Math.round(grossJpy * (AFFILIATE_RATES[surface] ?? 0));
}
