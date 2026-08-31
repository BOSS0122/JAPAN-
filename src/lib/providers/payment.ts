import type { PaymentProvider } from "./types";

/**
 * The default: no payment processor.
 *
 * It reports `live: false` and refuses to be called, so a paid order can never
 * quietly succeed without money changing hands. Before launch the application
 * lets transactions through and marks them uncollected — that is a demo, and
 * the interface says so. After launch it refuses them outright.
 */
export const noPaymentProvider: PaymentProvider = {
  id: "none",
  name: "No payment provider",
  live: false,
  async charge() {
    throw new Error(
      "No payment provider is configured. Set PAYMENT_PROVIDER and register an adapter in src/lib/providers/index.ts.",
    );
  },
};

/**
 * Sketch of a real adapter, kept as a comment rather than as code that looks
 * finished. With Stripe the shape is:
 *
 *   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
 *   export const stripePaymentProvider: PaymentProvider = {
 *     id: "stripe",
 *     name: "Stripe",
 *     live: Boolean(process.env.STRIPE_SECRET_KEY),
 *     async charge({ amountJpy, reference, description, email, returnUrl }) {
 *       const session = await stripe.checkout.sessions.create({
 *         mode: "payment",
 *         customer_email: email,
 *         client_reference_id: reference,
 *         line_items: [{
 *           quantity: 1,
 *           price_data: {
 *             currency: "jpy",              // JPY is zero-decimal: no ×100
 *             unit_amount: amountJpy,
 *             product_data: { name: description },
 *           },
 *         }],
 *         success_url: returnUrl,
 *         cancel_url: returnUrl,
 *       });
 *       return { id: session.id, status: "requires_action", redirectUrl: session.url! };
 *     },
 *   };
 *
 * The order is only `paid` once the webhook confirms it — a returned traveller
 * is not proof of payment, and treating it as such is how shops get robbed.
 */
