/**
 * Whether the traveller site is open to the public.
 *
 * Unpublished is the default, and it is a positive opt-in to go live: a
 * misconfigured deploy should show a holding page, never a half-finished shop.
 * `LAUNCHED=true` in the environment is the whole switch.
 *
 * This gates the traveller app only. The editor console stays reachable so the
 * catalogue can be filled before anyone can see it — which is the entire point
 * of having a pre-launch period.
 */
export function isLaunched(): boolean {
  return process.env.LAUNCHED === "true";
}

/**
 * Whether a transaction with a price on it can be accepted at all.
 *
 * Before launch the demo is allowed and marked uncollected. After launch it
 * needs a real processor. Resolved on the server and handed to the purchase
 * screens, so they can say so before someone fills in a form — a button that
 * silently does nothing is worse than one that explains itself.
 */
export function paidTransactionsAllowed(paymentsAreLive: boolean): boolean {
  return !isLaunched() || paymentsAreLive;
}
