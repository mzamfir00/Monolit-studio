import type { Metadata } from "next";
import { CheckoutForm } from "./CheckoutForm";
import { isPaymentSimulationEnabled, isStripeEnabled } from "@/lib/server/payments";

export const metadata: Metadata = { title: "Finalizează comanda", robots: { index: false } };

// Payment configuration is read per request, not frozen at build time.
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ anulat?: string }> }) {
  const { anulat } = await searchParams;
  return (
    <CheckoutForm
      stripeEnabled={isStripeEnabled()}
      simulationEnabled={isPaymentSimulationEnabled()}
      cancelledOrder={typeof anulat === "string" ? anulat.slice(0, 20) : null}
    />
  );
}
