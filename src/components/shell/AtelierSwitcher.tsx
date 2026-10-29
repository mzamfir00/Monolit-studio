import Link from "next/link";
import { CreditCard } from "lucide-react";
import { ATELIERS, ATELIER_ORDER } from "@/lib/branches";
import { cn } from "@/lib/format";
import type { Atelier } from "@/lib/types";
import { CartButton } from "@/components/cart/CartButton";
import { SwitcherNav } from "./SwitcherNav";

/**
 * Global top bar for jumping between ateliers. It is rendered inside the current shell, so it wears the
 * active atelier's theme; each swatch sets its own data-branch to preview that atelier's palette.
 */
export function AtelierSwitcher({ current }: { current: Atelier }) {
  return (
    <div className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 pl-2 pr-3 sm:pl-4 sm:pr-6">
        <span className="eyebrow hidden shrink-0 pl-2 text-muted lg:block">Atelierele</span>
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
                  "group relative flex h-12 shrink-0 items-center gap-2 px-3 text-[13px] transition-colors",
                  active ? "font-semibold text-ink" : "text-muted hover:text-ink",
                )}
              >
                <span
                  data-branch={key}
                  aria-hidden="true"
                  className="size-2.5 rounded-full ring-1 ring-[rgb(128_128_128/0.5)]"
                  style={{ background: "linear-gradient(135deg, var(--b-bg) 0 50%, var(--b-accent) 50% 100%)" }}
                />
                {atelier.shortName}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3 bottom-0 h-0.5 bg-accent transition-opacity",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                  )}
                />
              </Link>
            );
          })}
        </SwitcherNav>
        <p className="eyebrow hidden shrink-0 items-center gap-2 text-muted xl:flex">
          <CreditCard className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          Plată exclusiv cu cardul
        </p>
        <CartButton />
      </div>
    </div>
  );
}
