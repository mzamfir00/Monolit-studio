import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { AuthPanel } from "@/components/account/AuthPanel";
import { Guilloche } from "@/components/home/Guilloche";
import { safeNext } from "@/lib/account";
import { currentCustomer } from "@/lib/server/customer-auth";

export const metadata: Metadata = { title: "Contul tău", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const BENEFITS = [
  "Urmărești fiecare piesă prin atelier: alocare pe M20, gravare, ultrasunete, ambalare.",
  "Vezi textul exact gravat, fontul și simbolul ales, pentru fiecare comandă.",
  "Numele, telefonul și adresa de livrare se completează singure la comanda următoare.",
];

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; mod?: string }> }) {
  const { next, mod } = await searchParams;
  const destination = safeNext(next);
  if (await currentCustomer()) redirect(destination);
  const mode = mod === "creare" || mod === "resetare" ? mod : "autentificare";

  return (
    <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-20 lg:py-20">
      <section className="relative grid gap-8 overflow-hidden">
        <Guilloche className="pointer-events-none absolute -right-24 -top-16 size-80 text-metal opacity-30" />
        <p className="eyebrow text-metal-text">Maison Gravure · Contul tău</p>
        <h1 className="display text-h2">Gravurile tale, de la atelier până la ușa ta.</h1>
        <ul className="grid max-w-lg gap-4">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-3 text-muted">
              <Check className="mt-1 size-4 shrink-0 text-metal" aria-hidden="true" />
              {benefit}
            </li>
          ))}
        </ul>
        <p className="max-w-lg text-sm text-muted">
          Poți comanda și fără cont: comenzile se urmăresc oricând cu numărul comenzii și adresa de e-mail.
        </p>
      </section>
      <AuthPanel initialMode={mode} next={destination} />
    </div>
  );
}
