import Link from "next/link";
import { ArrowRight, Ban, CreditCard, ShieldCheck } from "lucide-react";
import { AtelierSelector, type AtelierEntry } from "@/components/home/AtelierSelector";
import { EngravingDiagram } from "@/components/home/EngravingDiagram";
import { Guilloche } from "@/components/home/Guilloche";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductVisual } from "@/components/product/ProductVisual";
import { ATELIERS } from "@/lib/branches";
import { getFeaturedProducts, getProduct, getProductsByBranch } from "@/lib/catalog";
import { formatRon } from "@/lib/format";
import { BRANCHES } from "@/lib/types";
import { ENGRAVING_METHODS, MACHINES, MACHINE_ORDER, WORKFLOW_STEPS } from "@/lib/workshop";

const RING_TEXT = "GRAVURĂ MECANICĂ · VÂRF DE DIAMANT · FREZĂ ROTATIVĂ · TREI GRAVOGRAPH M20 · ";

function Hero() {
  const umbrella = ATELIERS.umbrella;
  return (
    <section className="texture relative overflow-hidden border-b border-line">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:py-24">
        <div className="animate-rise lg:col-span-7">
          <p className="eyebrow text-metal-text">{umbrella.eyebrow}</p>
          <h1 className="display mt-6 text-hero">
            Gravură mecanică, <em className="text-accent">pentru o viață întreagă.</em>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">{umbrella.heroLead}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="#ateliere" className="btn btn-primary">
              Alege atelierul
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="#masini" className="btn btn-ghost">
              Cele trei M20
            </Link>
          </div>
          <dl className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-line pt-6">
            {[
              ["Mașini", "3 × M20"],
              ["Tehnici", "Diamant & freză"],
              ["Laser", "Niciodată"],
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="eyebrow text-muted">{term}</dt>
                <dd className="display mt-2 text-2xl sm:text-3xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md lg:col-span-5 lg:max-w-none">
          <Guilloche className="absolute inset-0 size-full animate-spin-slow text-metal-text" />
          <svg viewBox="-200 -200 400 400" className="absolute inset-0 size-full" aria-hidden="true">
            <defs>
              <path id="seal-ring" d="M0,-104a104,104 0 1,1 -0.01,0" />
            </defs>
            <circle r="122" fill="var(--b-bg)" opacity="0.94" />
            <circle r="122" fill="none" stroke="var(--b-metal)" strokeWidth="1" />
            <circle r="90" fill="none" stroke="var(--b-metal)" strokeWidth="0.6" />
            <text
              fill="var(--b-ink)"
              fontSize="9.6"
              letterSpacing="2.2"
              style={{ fontFamily: "var(--b-font-sans)", fontWeight: 600 }}
            >
              <textPath href="#seal-ring">{RING_TEXT}</textPath>
            </text>
            <text
              y="8"
              textAnchor="middle"
              fill="var(--b-accent)"
              fontSize="72"
              style={{ fontFamily: "var(--b-font-display)", fontStyle: "italic", fontWeight: 500 }}
            >
              MG
            </text>
            <text
              y="44"
              textAnchor="middle"
              fill="var(--b-metal-text)"
              fontSize="9"
              letterSpacing="3"
              style={{ fontFamily: "var(--b-font-sans)", fontWeight: 600 }}
            >
              ATELIER · M20
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}

function Ateliers() {
  const entries: AtelierEntry[] = BRANCHES.map((branch) => {
    const atelier = ATELIERS[branch];
    const hero = getProduct(branch, atelier.heroProductSlug!)!;
    return {
      key: branch,
      name: atelier.name,
      shortName: atelier.shortName,
      category: atelier.category,
      tagline: atelier.tagline,
      typePairing: atelier.typePairing,
      href: atelier.href,
      productCount: getProductsByBranch(branch).length,
      heroCaption: `${hero.name} · ${formatRon(hero.priceBani)}`,
      visual: <ProductVisual product={hero} className="size-full" />,
    };
  });
  return (
    <section id="ateliere" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mb-12 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow text-metal-text">Patru ateliere, o singură mână</p>
            <h2 className="display mt-4 text-h2">Fiecare atelier are limba lui.</h2>
          </div>
          <p className="self-end text-muted lg:col-span-5">
            Aceleași mașini, același standard de execuție — dar alt metal, altă tehnică și altă estetică pentru fiecare lume.
            Treci cu mouse-ul peste un atelier ca să-i vezi identitatea.
          </p>
        </div>
        <AtelierSelector entries={entries} />
      </div>
    </section>
  );
}

function Machines() {
  return (
    <section id="masini" className="scroll-mt-16 border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-3xl">
          <p className="eyebrow text-metal-text">Atelierul</p>
          <h2 className="display mt-4 text-h2">Trei mașini. Două tehnici. Nicio rază laser.</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Laserul arde suprafața și lasă o urmă mată. Noi lucrăm mecanic: metalul e fie comprimat de un vârf de diamant, fie
            sculptat de o freză din carbură. Diferența se vede în lumină și se simte sub deget.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {(["DIAMOND_DRAG", "ROTARY_MILLING"] as const).map((method) => {
            const info = ENGRAVING_METHODS[method];
            return (
              <article key={method} className="grid gap-6 rounded-branch-lg border border-line bg-bg p-7 sm:p-9">
                <EngravingDiagram method={method} className="w-full text-muted" />
                <div className="grid gap-3">
                  <p className="eyebrow text-metal-text">{info.depthNote}</p>
                  <h3 className="display text-3xl">{info.label}</h3>
                  <p className="text-muted">{info.summary}</p>
                </div>
              </article>
            );
          })}
        </div>

        <ol className="mt-6 grid gap-6 lg:grid-cols-3">
          {MACHINE_ORDER.map((key, index) => {
            const machine = MACHINES[key];
            return (
              <li key={key} className="grid content-start gap-4 rounded-branch-lg border border-line bg-bg p-7">
                <div className="flex items-baseline justify-between">
                  <span className="display text-5xl text-metal">0{index + 1}</span>
                  <span className="eyebrow text-muted">{machine.shortLabel}</span>
                </div>
                <h3 className="display text-2xl">{machine.role}</h3>
                <p className="text-sm text-muted">{machine.description}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {machine.suggestedFor.map((branch) => (
                    <Link
                      key={branch}
                      href={ATELIERS[branch].href}
                      data-branch={branch}
                      className="wordmark rounded-branch border border-line bg-bg px-3 py-2 text-xs text-ink"
                    >
                      {ATELIERS[branch].name}
                    </Link>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function Masterpieces() {
  const featured = getFeaturedProducts();
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-metal-text">Din toate atelierele</p>
            <h2 className="display mt-4 text-h2">{ATELIERS.umbrella.collectionTitle}</h2>
          </div>
          <p className="max-w-md text-muted">{ATELIERS.umbrella.collectionLead}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} showBranch />
          ))}
        </div>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section id="proces" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <p className="eyebrow text-metal-text">De la plată la AWB</p>
        <h2 className="display mt-4 max-w-3xl text-h2">Șase stații, aceeași ordine pentru fiecare piesă.</h2>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-branch-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-6">
          {WORKFLOW_STEPS.map((step, index) => (
            <li key={step.status} className="grid content-start gap-3 bg-bg p-6">
              <span className="font-mono text-xs text-metal-text">0{index + 1}</span>
              <h3 className="display text-xl">{step.label}</h3>
              <p className="text-sm text-muted">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Payment() {
  const reasons = [
    {
      icon: Ban,
      title: "Fără ramburs",
      body: "O piesă gravată cu numele tău nu mai poate fi vândută altcuiva. Un colet nerevendicat înseamnă metal pierdut.",
    },
    {
      icon: CreditCard,
      title: "Doar card, prin Stripe",
      body: "Plătești securizat cu cardul. Datele cardului nu ajung niciodată la noi.",
    },
    {
      icon: ShieldCheck,
      title: "Producția pornește după plată",
      body: "Comanda intră în coada M20 doar după confirmarea plății — fără avansuri, fără surprize.",
    },
  ];
  return (
    <section id="plata" className="scroll-mt-16 bg-accent text-accent-ink">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-5">
          <p className="eyebrow opacity-70">Politica de plată</p>
          <h2 className="display mt-4 text-h2">Plată exclusiv cu cardul.</h2>
        </div>
        <ul className="grid gap-8 sm:grid-cols-3 lg:col-span-7">
          {reasons.map(({ icon: Icon, title, body }) => (
            <li key={title} className="grid content-start gap-3">
              <Icon className="size-6 text-metal" strokeWidth={1.5} aria-hidden="true" />
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-sm opacity-80">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Ateliers />
      <Machines />
      <Masterpieces />
      <Process />
      <Payment />
    </>
  );
}
