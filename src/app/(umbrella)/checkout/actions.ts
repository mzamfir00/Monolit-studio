"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseCheckoutLines, validateCustomer, type CheckoutErrors } from "@/lib/checkout";
import { CheckoutError, attachCheckoutSession, cancelPendingOrder, createPendingOrder, markOrderPaid } from "@/lib/server/orders";
import { isPaymentSimulationEnabled, isStripeEnabled } from "@/lib/server/payments";
import { createCheckoutSession } from "@/lib/server/stripe-checkout";

export interface CheckoutState {
  errors?: CheckoutErrors;
  formError?: string;
  /** Hosted Stripe Checkout page; the browser navigates there itself. */
  redirectUrl?: string;
}

async function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/**
 * Validates the customer, re-prices the cart from the database and creates the order. With Stripe it then
 * redirects to hosted, card-only Checkout; with the development simulation it is marked paid at once.
 */
export async function placeOrder(formData: FormData): Promise<CheckoutState> {
  const simulate = formData.get("intent") === "simulate";
  const { customer, errors } = validateCustomer(formData);

  let lines = null;
  try {
    lines = parseCheckoutLines(JSON.parse(String(formData.get("cart") ?? "")));
  } catch {
    // handled below
  }
  if (!lines) return { formError: "Coșul nu a putut fi citit. Reîncarcă pagina și încearcă din nou." };
  if (!customer) return { errors, formError: "Verifică câmpurile marcate mai sus." };

  if (simulate && !isPaymentSimulationEnabled()) return { formError: "Simularea plății este disponibilă doar în dezvoltare." };
  if (!simulate && !isStripeEnabled()) {
    return { formError: "Plata cu cardul nu este configurată încă (lipsește STRIPE_SECRET_KEY)." };
  }

  let order;
  try {
    order = await createPendingOrder(customer, lines, Number(formData.get("expectedTotal")));
  } catch (error) {
    if (error instanceof CheckoutError) return { formError: error.message };
    console.error("Order creation failed", error);
    return { formError: "Nu am putut înregistra comanda. Încearcă din nou în câteva momente." };
  }

  const tracking = `/comanda/${order.number}?cheie=${order.accessToken}&nou=1`;
  if (simulate) {
    try {
      await markOrderPaid(order.id, { simulated: true });
    } catch (error) {
      console.error("Simulated payment failed", error);
      return { formError: "Simularea plății a eșuat. Încearcă din nou." };
    }
    redirect(tracking);
  }

  let checkoutUrl: string | null = null;
  try {
    const session = await createCheckoutSession(order, await siteOrigin());
    await attachCheckoutSession(order.id, session.id);
    checkoutUrl = session.url;
  } catch (error) {
    console.error("Stripe Checkout session failed", error);
  }
  if (!checkoutUrl) {
    await cancelPendingOrder(order.id, "Sesiunea de plată Stripe nu a putut fi creată");
    return { formError: "Nu am putut deschide pagina de plată Stripe. Încearcă din nou." };
  }
  return { redirectUrl: checkoutUrl };
}
