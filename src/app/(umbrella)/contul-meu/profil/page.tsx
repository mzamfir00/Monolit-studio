import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/ProfileForm";
import { displayPhone } from "@/lib/account";
import { requireCustomer } from "@/lib/server/customer-auth";

export const metadata: Metadata = { title: "Datele mele" };

export default async function ProfilePage() {
  const customer = await requireCustomer("/contul-meu/profil");
  return (
    <section aria-label="Datele mele și adresa" className="grid gap-8">
      <ProfileForm
        defaults={{
          name: customer.name,
          email: customer.email,
          phone: displayPhone(customer.phone),
          shippingAddress: customer.shippingAddress ?? "",
          shippingCity: customer.shippingCity ?? "",
          shippingCounty: customer.shippingCounty ?? "",
          shippingPostalCode: customer.shippingPostalCode ?? "",
        }}
      />
    </section>
  );
}
