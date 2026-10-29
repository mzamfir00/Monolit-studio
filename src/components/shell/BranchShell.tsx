import Link from "next/link";
import type { ReactNode } from "react";
import { ATELIERS, ATELIER_ORDER } from "@/lib/branches";
import type { Atelier } from "@/lib/types";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AtelierSwitcher } from "./AtelierSwitcher";
import { BranchMark } from "./BranchMark";

function navFor(atelier: Atelier): Array<[href: string, label: string]> {
  if (atelier === "umbrella") {
    return [
      ["/#ateliere", "Ateliere"],
      ["/#masini", "Mașinile M20"],
      ["/#proces", "Procesul"],
      ["/#plata", "Plata"],
    ];
  }
  const base = ATELIERS[atelier].href;
  return [
    [`${base}#colectia`, "Colecția"],
    ...(atelier === "corporate" ? ([[`${base}#volum`, "Calculator de volum"]] as Array<[string, string]>) : []),
    [`${base}#tehnica`, "Tehnica"],
    [`${base}#ateliere`, "Alte ateliere"],
  ];
}

function Masthead({ atelier }: { atelier: Atelier }) {
  const config = ATELIERS[atelier];
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href={config.href} className="flex min-w-0 items-center gap-3">
          <BranchMark atelier={atelier} className="size-8 shrink-0 text-metal" />
          <span className="grid gap-1">
            <span className="wordmark text-lg sm:text-xl">{config.name}</span>
            <span className="eyebrow text-[10px] text-muted">{config.category}</span>
          </span>
        </Link>
        <nav aria-label={`Navigare ${config.name}`} className="hidden items-center gap-7 text-sm md:flex">
          {navFor(atelier).map(([href, label]) => (
            <Link key={href} href={href} className="text-muted transition-colors hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function SiteFooter({ atelier }: { atelier: Atelier }) {
  const config = ATELIERS[atelier];
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="grid content-start gap-4">
          <BranchMark atelier={atelier} className="size-10 text-metal" />
          <p className="wordmark text-lg">{config.name}</p>
          <p className="max-w-xs text-sm text-muted">{config.tagline}</p>
        </div>
        <div className="grid content-start gap-3 text-sm">
          <p className="eyebrow text-muted">Ateliere</p>
          {ATELIER_ORDER.map((key) => (
            <Link key={key} href={ATELIERS[key].href} className="w-fit hover:underline">
              {ATELIERS[key].name}
            </Link>
          ))}
        </div>
        <div className="grid content-start gap-3 text-sm">
          <p className="eyebrow text-muted">Comenzi</p>
          <p>Plată exclusiv cu cardul, prin Stripe</p>
          <p>Fără ramburs — fiecare piesă e gravată pe numele tău</p>
          <p>Produsele personalizate sunt exceptate de la dreptul de retragere (OUG 34/2014)</p>
          <p>Livrare prin curier, cu AWB, în toată România</p>
        </div>
        <div className="grid content-start gap-3 text-sm">
          <p className="eyebrow text-muted">Atelierul</p>
          <p>3 × Gravograph M20</p>
          <p>Gravură cu diamant și frezare rotativă</p>
          <p>Curățare cu ultrasunete și lustruire manuală</p>
          <Link href="/#masini" className="w-fit hover:underline">
            Povestea mașinilor →
          </Link>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} Maison Gravure · Prețuri în RON
        </p>
      </div>
    </footer>
  );
}

/** Page frame for one atelier: sets data-branch, so everything inside — cart included — wears its theme. */
export function BranchShell({ atelier, children }: { atelier: Atelier; children: ReactNode }) {
  return (
    <div data-branch={atelier} className="branch-shell flex min-h-dvh flex-col">
      <AtelierSwitcher current={atelier} />
      <Masthead atelier={atelier} />
      <main className="flex-1">{children}</main>
      <SiteFooter atelier={atelier} />
      <CartDrawer />
    </div>
  );
}
