"use server";

import { redirect } from "next/navigation";
import { passwordError } from "@/lib/account";
import { parseCheckoutLines, validateCustomer, type CheckoutErrors } from "@/lib/checkout";
import { currentCustomer, startCustomerSession } from "@/lib/server/customer-auth";
import {
  attachOrderToCustomer,
  emailRegistered,
  registerCustomer,
  registrationAllowed,
  rememberAddress,
} from "@/lib/server/customers";
import { CheckoutError, attachCheckoutSession, cancelPendingOrder, createPendingOrder, markOrderPaid } from "@/lib/server/orders";
import { isPaymentSimulationEnabled, isStripeEnabled } from "@/lib/server/payments";
import { invalidateCatalog } from "@/lib/server/catalog";
import { clientAddress, requestOrigin } from "@/lib/server/request-origin";
import { createCheckoutSession } from "@/lib/server/stripe-checkout";

export interface CheckoutState {
  errors?: CheckoutErrors;
  formError?: string;
  /** Hosted Stripe Checkout page; the browser navigates there itself. */
  redirectUrl?: string;
}

/**
 * Validates the customer, re-prices the cart from the database and creates the order. With Stripe it then
 * redirects to hosted, card-only Checkout; with the development simulation it is marked paid at once.
 */
export async function placeOrder(formData: FormData): Promise<CheckoutState> {
  const simulate = formData.get("intent") === "simulate";
  const { customer, errors } = validateCustomer(formData);

  // Signed-in customers get the order in their account; guests may open an account with it.
  const account = await currentCustomer();
  const createAccount = !account && formData.get("createAccount") === "on";
  const accountPassword = typeof formData.get("accountPassword") === "string" ? String(formData.get("accountPassword")) : "";
  if (createAccount) {
    const weak = passwordError(accountPassword);
    if (weak) errors.accountPassword = weak;
  }

  let lines = null;
  try {
    lines = parseCheckoutLines(JSON.parse(String(formData.get("cart") ?? "")));
  } catch {
    // handled below
  }
  if (!lines) return { formError: "Coșul nu a putut fi citit. Reîncarcă pagina și încearcă din nou." };
  if (!customer || errors.accountPassword) return { errors, formError: "Verifică câmpurile marcate mai sus." };
  if (createAccount) {
    if (await emailRegistered(customer.email)) {
      return {
        errors: { email: "Există deja un cont cu acest e-mail. Autentifică-te sau debifează crearea contului." },
        formError: "Verifică câmpurile marcate mai sus.",
      };
    }
    if (!(await registrationAllowed(await clientAddress()))) {
      return { formError: "Prea multe conturi create de pe această conexiune. Debifează crearea contului și încearcă din nou." };
    }
  }

  if (simulate && !isPaymentSimulationEnabled()) return { formError: "Simularea plății este disponibilă doar în dezvoltare." };
  if (!simulate && !isStripeEnabled()) {
    return { formError: "Plata cu cardul nu este configurată încă (lipsește STRIPE_SECRET_KEY)." };
  }

  let order;
  try {
    order = await createPendingOrder(customer, lines, Number(formData.get("expectedTotal")), account?.id ?? null);
  } catch (error) {
    if (error instanceof CheckoutError) return { formError: error.message };
    console.error("Order creation failed", error);
    return { formError: "Nu am putut înregistra comanda. Încearcă din nou în câteva momente." };
  }

  // The order exists, so account bookkeeping never blocks the payment.
  try {
    if (account) {
      await rememberAddress(account.id, customer.phone, customer.shipping);
    } else if (createAccount) {
      const created = await registerCustomer(
        { name: customer.billing.name, email: customer.email, password: accountPassword, phone: customer.phone },
        customer.shipping,
      );
      if ("id" in created) {
        await attachOrderToCustomer(order.id, created.id);
        await startCustomerSession(created.id);
      }
    }
  } catch (error) {
    console.error("Linking the order to a customer account failed", error);
  }

  const tracking = `/comanda/${order.number}?cheie=${order.accessToken}&nou=1`;
  if (simulate) {
    try {
      await markOrderPaid(order.id, { simulated: true });
      invalidateCatalog();
    } catch (error) {
      console.error("Simulated payment failed", error);
      return { formError: "Simularea plății a eșuat. Încearcă din nou." };
    }
    redirect(tracking);
  }

  let checkoutUrl: string | null = null;
  try {
    const session = await createCheckoutSession(order, await requestOrigin());
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
