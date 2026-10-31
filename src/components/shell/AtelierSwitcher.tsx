import Link from "next/link";
import { CircleUserRound, CreditCard } from "lucide-react";
import { ATELIERS, ATELIER_ORDER } from "@/lib/branches";
import { cn } from "@/lib/format";
import type { Atelier } from "@/lib/types";
import { CartButton } from "@/components/cart/CartButton";
import { SwitcherNav } from "./SwitcherNav";

interface BarStyle {
  bar: string;
  label: string;
  link: string;
  active: string;
  idle: string;
  /** Underline marking the current atelier; null where the active state is a fill. */
  indicator: string | null;
  swatch: string;
}

/**
 * The bar morphs with the atelier it sits in: imperial hairline on the hub, an inverted forest-green band
 * with cream pills on Pedigree, whisper-quiet serif on Aurum, a carbon HUD on the Vault, ruled cells on Bespoke.
 */
const BAR: Record<Atelier, BarStyle> = {
  umbrella: {
    bar: "border-b border-line bg-bg/90 backdrop-blur-md",
    label: "eyebrow text-muted",
    link: "h-12 px-3 text-[13px]",
    active: "font-semibold text-ink",
    idle: "text-muted hover:text-ink",
    indicator: "inset-x-3 bottom-0 h-0.5 bg-accent",
    swatch: "rounded-full",
  },
  pet: {
    // switcher-inverted swaps the palette (branch-systems.css), so ink is cream and bg is forest green here.
    bar: "switcher-inverted bg-bg",
    label: "eyebrow text-muted",
    link: "my-2 h-8 rounded-full px-3.5 text-[13px] font-medium",
    active: "bg-ink text-bg",
    idle: "text-muted hover:bg-ink/10 hover:text-ink",
    indicator: null,
    swatch: "rounded-full",
  },
  jewelry: {
    bar: "border-b-[0.5px] border-line bg-bg/95 backdrop-blur-md",
    label: "text-[10px] uppercase tracking-[0.35em] text-muted",
    link: "h-12 px-3.5 font-display text-[15px]",
    active: "text-ink",
    idle: "text-muted hover:text-ink",
    indicator: "inset-x-3.5 bottom-3 h-px bg-accent",
    swatch: "rounded-none",
  },
  vault: {
    bar: "border-b border-line bg-bg/95 backdrop-blur-md",
    label: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted",
    link: "h-12 px-3 font-mono text-[11px] uppercase tracking-[0.12em]",
    active: "text-accent",
    idle: "text-muted hover:text-ink",
    indicator: "inset-x-3 bottom-0 h-0.5 bg-accent shadow-[0_0_12px_var(--b-accent)]",
    swatch: "rounded-none",
  },
  corporate: {
    bar: "border-b border-grid bg-bg",
    label: "font-mono text-[10px] uppercase tracking-[0.12em] text-muted",
    link: "h-12 border-r border-grid px-4 font-mono text-[11px] uppercase tracking-[0.1em] first:border-l",
    active: "bg-ink text-panel",
    idle: "text-ink hover:bg-panel",
    indicator: null,
    swatch: "rounded-none",
  },
};

/**
 * Global top bar for jumping between ateliers. It is rendered inside the current shell, so it wears the
 * active atelier's theme; each swatch sets its own data-branch to preview that atelier's palette.
 */
export function AtelierSwitcher({ current }: { current: Atelier }) {
  const style = BAR[current];
  return (
    <div data-branch={current} className={cn("sticky top-0 z-40 text-ink", style.bar)}>
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 pl-2 pr-3 sm:pl-4 sm:pr-6">
        <span className={cn("hidden shrink-0 pl-2 lg:block", style.label)}>Atelierele</span>
        <SwitcherNav>
          {ATELIER_ORDER.map((key) => {
            const atelier = ATELIERS[key];
            const active = key === current;
            return (
              <Link
                key={key}
                href={atelier.href}
                aria-current={active ? "page" : undefined}
                title={`${atelier.name} — ${atelier.category}`}
                className={cn(
                  "group relative flex shrink-0 items-center gap-2 transition-colors",
                  style.link,
                  active ? style.active : style.idle,
                )}
              >
                <span
                  data-branch={key}
                  aria-hidden="true"
                  className={cn("size-2.5 ring-1 ring-[rgb(128_128_128/0.5)]", style.swatch)}
                  style={{ background: "linear-gradient(135deg, var(--b-bg) 0 50%, var(--b-accent) 50% 100%)" }}
                />
                {current === "vault" && active ? `[ ${atelier.shortName} ]` : atelier.shortName}
                {style.indicator && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute transition-opacity",
                      style.indicator,
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                    )}
                  />
                )}
              </Link>
            );
          })}
        </SwitcherNav>
        <p className={cn("hidden shrink-0 items-center gap-2 xl:flex", style.label)}>
          <CreditCard className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          Plată exclusiv cu cardul
        </p>
        <Link
          href="/contul-meu"
          aria-label="Contul meu"
          title="Contul meu"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
        >
          <CircleUserRound className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
        </Link>
        <CartButton />
      </div>
    </div>
  );
}
