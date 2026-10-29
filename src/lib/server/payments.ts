import "server-only";
import Stripe from "stripe";

// Card-only payments through Stripe Checkout, plus a development-only simulation that marks an order paid
// without Stripe so the whole order flow can be exercised locally.

const secretKey = () => process.env.STRIPE_SECRET_KEY?.trim() || undefined;

export const isStripeEnabled = () => Boolean(secretKey());

/**
 * Simulation is available in `next dev`, or when PAYMENT_SIMULATION=true, and never while a live Stripe key
 * is configured — so a forgotten flag cannot turn into free orders in production.
 */
export function isPaymentSimulationEnabled(): boolean {
  const requested = process.env.NODE_ENV === "development" || process.env.PAYMENT_SIMULATION === "true";
  return requested && !/^(sk|rk)_live_/.test(secretKey() ?? "");
}

let client: Stripe | null = null;

/** Created lazily: the key is not present while the static storefront is built. */
export function stripe(): Stripe {
  const key = secretKey();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  client ??= new Stripe(key);
  return client;
}
