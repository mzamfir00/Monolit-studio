import type { Metadata } from "next";
import { CheckoutForm } from "./CheckoutForm";
import { displayPhone } from "@/lib/account";
import { currentCustomer } from "@/lib/server/customer-auth";
import { isPaymentSimulationEnabled, isStripeEnabled } from "@/lib/server/payments";

export const metadata: Metadata = { title: "Finalizează comanda", robots: { index: false } };

// Payment configuration is read per request, not frozen at build time.
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ anulat?: string }> }) {
  const { anulat } = await searchParams;
  const customer = await currentCustomer();
  return (
    <CheckoutForm
      account={
        customer && {
          name: customer.name,
          email: customer.email,
          phone: displayPhone(customer.phone),
          address: customer.shippingAddress ?? "",
          city: customer.shippingCity ?? "",
          county: customer.shippingCounty ?? "",
          postalCode: customer.shippingPostalCode ?? "",
        }
      }
      stripeEnabled={isStripeEnabled()}
      simulationEnabled={isPaymentSimulationEnabled()}
      cancelledOrder={typeof anulat === "string" ? anulat.slice(0, 20) : null}
    />
  );
}
