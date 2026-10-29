import type Stripe from "stripe";
import { cancelPendingOrder } from "@/lib/server/orders";
import { isStripeEnabled, stripe } from "@/lib/server/payments";
import { settleCheckoutSession } from "@/lib/server/stripe-checkout";

// Stripe → us. Configure the endpoint for checkout.session.completed and checkout.session.expired
// (locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`).

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeEnabled() || !secret) return new Response("Stripe is not configured.", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature.", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature.", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await settleCheckoutSession(event.data.object);
      break;
    case "checkout.session.expired": {
      const orderId = event.data.object.metadata?.orderId;
      if (orderId) await cancelPendingOrder(orderId, "Sesiunea de plată Stripe a expirat");
      break;
    }
  }
  return Response.json({ received: true });
}
