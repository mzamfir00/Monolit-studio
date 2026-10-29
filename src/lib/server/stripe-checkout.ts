import "server-only";
import type Stripe from "stripe";
import { describeEngraving } from "@/lib/engraving";
import { db } from "@/lib/prisma";
import { markOrderPaid, type PendingOrder } from "./orders";
import { stripe } from "./payments";

/** Hosted Stripe Checkout, restricted to cards, priced line by line from the server-side quote. */
export async function createCheckoutSession(order: PendingOrder, origin: string) {
  const trackingUrl = `${origin}/comanda/${order.number}?cheie=${order.accessToken}`;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.lines.flatMap((line) => [
    {
      quantity: line.quantity,
      price_data: {
        currency: "ron",
        unit_amount: line.quote.unitBani,
        product_data: {
          name: `${line.product.name} — ${line.engraving.variantName}`,
          description: describeEngraving(line.engraving).slice(0, 480),
        },
      },
    },
    ...(line.quote.setupFeeBani > 0
      ? [
          {
            quantity: 1,
            price_data: {
              currency: "ron",
              unit_amount: line.quote.setupFeeBani,
              product_data: { name: `Vectorizare schiță — ${line.product.name}` },
            },
          },
        ]
      : []),
  ]);

  return stripe().checkout.sessions.create(
    {
      mode: "payment",
      allowed_payment_method_types: ["card"],
      line_items: lineItems,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: order.shippingBani === 0 ? "Curier cu AWB — gratuit" : "Curier cu AWB",
            fixed_amount: { amount: order.shippingBani, currency: "ron" },
          },
        },
      ],
      customer_email: order.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.number },
      payment_intent_data: {
        description: `Comanda ${order.number}`,
        metadata: { orderId: order.id, orderNumber: order.number },
      },
      locale: "ro",
      // Shortest window Stripe allows, so abandoned orders are released quickly via checkout.session.expired.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${trackingUrl}&nou=1`,
      cancel_url: `${origin}/checkout?anulat=${order.number}`,
    },
    { idempotencyKey: `checkout-session-${order.id}` },
  );
}

/**
 * Marks the order paid when a completed session really pays for it: same session id, amount and currency as
 * stored. Shared by the webhook and the success page (for when the webhook has not arrived yet).
 */
export async function settleCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId || session.payment_status !== "paid") return false;
  const order = await db().order.findUnique({
    where: { id: orderId },
    select: { totalBani: true, stripeCheckoutSessionId: true },
  });
  if (
    !order ||
    order.stripeCheckoutSessionId !== session.id ||
    session.amount_total !== order.totalBani ||
    session.currency !== "ron"
  ) {
    console.error("Stripe session does not match its order", { orderId, sessionId: session.id, amount: session.amount_total });
    return false;
  }
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  return markOrderPaid(orderId, { paymentIntentId });
}

/** Success-page fallback: asks Stripe directly whether a still-pending order was paid. */
export async function refreshFromStripe(sessionId: string) {
  try {
    return await settleCheckoutSession(await stripe().checkout.sessions.retrieve(sessionId));
  } catch (error) {
    console.error("Could not retrieve Stripe session", error);
    return false;
  }
}
