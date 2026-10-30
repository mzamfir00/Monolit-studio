import Link from "next/link";
import type { ReactNode } from "react";
import { ATELIERS, ATELIER_ORDER } from "@/lib/branches";
import { cn } from "@/lib/format";
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

function Brand({ atelier, className }: { atelier: Atelier; className?: string }) {
  const config = ATELIERS[atelier];
  return (
    <Link href={config.href} className={cn("flex min-w-0 items-center gap-3", className)}>
      <BranchMark atelier={atelier} className="size-8 shrink-0 text-metal" />
      <span className="grid gap-1">
        <span className="wordmark text-lg sm:text-xl">{config.name}</span>
        <span className="eyebrow text-[10px] text-muted">{config.category}</span>
      </span>
    </Link>
  );
}

/** The atelier's own header: same links everywhere, a different architecture per atelier. */
function Masthead({ atelier }: { atelier: Atelier }) {
  const config = ATELIERS[atelier];
  const links = navFor(atelier);
  const label = `Navigare ${config.name}`;

  switch (atelier) {
    case "jewelry":
      // Centred couture masthead: mark, spaced wordmark, then a whisper of navigation.
      return (
        <header className="border-b-[0.5px] border-line">
          <div className="mx-auto grid max-w-7xl justify-items-center gap-5 px-4 py-7 sm:px-6">
            <Link href={config.href} className="grid justify-items-center gap-2.5">
              <BranchMark atelier={atelier} className="size-7 text-metal" />
              <span className="wordmark text-xl sm:text-2xl">{config.name}</span>
              <span className="text-[9px] uppercase tracking-[0.35em] text-muted">{config.category}</span>
            </Link>
            <nav aria-label={label} className="hidden items-center gap-10 text-[10px] uppercase tracking-[0.3em] md:flex">
              {links.map(([href, text]) => (
                <Link
                  key={href}
                  href={href}
                  className="border-b-[0.5px] border-transparent pb-1 text-muted hover:border-ink hover:text-ink"
                >
                  {text}
                </Link>
              ))}
            </nav>
          </div>
        </header>
      );
    case "corporate":
      // Ruled header: logo cell and one cell per link, sharing the page grid's 1px black rules.
      return (
        <header className="border-b border-grid">
          <div className="mx-auto flex h-16 max-w-7xl items-stretch justify-between px-4 sm:px-6">
            <Brand atelier={atelier} className="border-x border-grid px-4 sm:px-5" />
            <nav aria-label={label} className="hidden items-stretch md:flex">
              {links.map(([href, text]) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center border-r border-grid px-5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors first:border-l hover:bg-ink hover:text-panel"
                >
                  {text}
                </Link>
              ))}
            </nav>
          </div>
        </header>
      );
    case "vault":
      return (
        <header className="border-b border-line bg-bg/70">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
            <Brand atelier={atelier} />
            <nav
              aria-label={label}
              className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[0.12em] md:flex"
            >
              {links.map(([href, text], index) => (
                <Link key={href} href={href} className="text-muted transition-colors hover:text-accent">
                  <span className="text-accent">[{String(index + 1).padStart(2, "0")}]</span> {text}
                </Link>
              ))}
            </nav>
          </div>
        </header>
      );
    case "pet":
      return (
        <header className="border-b-2 border-dashed border-accent/20">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
            <Brand atelier={atelier} />
            <nav aria-label={label} className="hidden items-center gap-1.5 md:flex">
              {links.map(([href, text]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-panel"
                >
                  {text}
                </Link>
              ))}
            </nav>
          </div>
        </header>
      );
    default:
      return (
        <header className="border-b border-line">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
            <Brand atelier={atelier} />
            <nav aria-label={label} className="hidden items-center gap-7 text-sm md:flex">
              {links.map(([href, text]) => (
                <Link key={href} href={href} className="text-muted transition-colors hover:text-ink">
                  {text}
                </Link>
              ))}
            </nav>
          </div>
        </header>
      );
  }
}

const FOOTER_RULE: Record<Atelier, string> = {
  umbrella: "border-t border-line",
  pet: "border-t-2 border-dashed border-accent/20",
  jewelry: "border-t-[0.5px] border-line",
  vault: "border-t border-line",
  corporate: "border-t border-grid",
};

function SiteFooter({ atelier }: { atelier: Atelier }) {
  const config = ATELIERS[atelier];
  return (
    <footer className={cn("mt-24", FOOTER_RULE[atelier])}>
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
