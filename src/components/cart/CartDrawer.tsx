"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CreditCard, Minus, Plus, Trash2, X } from "lucide-react";
import { ATELIERS } from "@/lib/branches";
import { BRANCHES } from "@/lib/types";
import { formatRon } from "@/lib/format";
import { cartSubtotal, useCart, useHydrated } from "@/store/cart";

/**
 * Slide-over Universal Cart. Mounted inside the page shell, so it inherits whichever atelier is on screen;
 * each line carries a badge themed in the branch it came from.
 */
export function CartDrawer() {
  const hydrated = useHydrated();
  const { items, isOpen, close, updateQuantity, removeItem } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;
  const lines = hydrated ? items : [];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md animate-drawer-in flex-col border-l border-line bg-bg text-ink shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 id="cart-title" className="display text-2xl">
            Coșul tău
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Închide coșul"
            className="flex size-10 items-center justify-center rounded-full hover:bg-ink/5"
          >
            <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center gap-6 px-6">
            <p className="text-muted">
              Coșul tău este gol. Fiecare piesă se gravează la comandă — alege un atelier pentru a începe.
            </p>
            <ul className="grid gap-2">
              {BRANCHES.map((branch) => (
                <li key={branch}>
                  <Link
                    href={ATELIERS[branch].href}
                    onClick={close}
                    data-branch={branch}
                    className="flex items-center justify-between rounded-branch border border-line bg-bg px-4 py-3 text-ink transition-colors hover:bg-surface"
                  >
                    <span className="wordmark text-sm">{ATELIERS[branch].name}</span>
                    <span className="eyebrow text-muted">{ATELIERS[branch].category}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {lines.map((item) => (
                <li key={item.id} className="grid gap-3 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid gap-1.5">
                      <span
                        data-branch={item.branch}
                        className="eyebrow w-fit rounded-full border border-line bg-bg px-2 py-0.5 text-[10px] text-ink"
                      >
                        {ATELIERS[item.branch].shortName}
                      </span>
                      <Link
                        href={`${ATELIERS[item.branch].href}/produs/${item.slug}`}
                        onClick={close}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-muted">{item.variantName}</p>
                      {item.engravingSummary && <p className="font-mono text-xs text-muted">{item.engravingSummary}</p>}
                    </div>
                    <p className="shrink-0 font-medium">{formatRon(item.unitPriceBani * item.quantity)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-branch border border-line">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Scade cantitatea pentru ${item.name}`}
                        className="flex size-9 items-center justify-center disabled:opacity-30"
                      >
                        <Minus className="size-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label={`Crește cantitatea pentru ${item.name}`}
                        className="flex size-9 items-center justify-center"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="flex items-center gap-1.5 text-sm text-muted hover:text-ink"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Elimină
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="grid gap-3 border-t border-line px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="display text-2xl">{formatRon(cartSubtotal(lines))}</span>
              </div>
              <p className="flex items-center gap-2 text-xs text-muted">
                <CreditCard className="size-3.5 shrink-0" aria-hidden="true" />
                Plata se face exclusiv cu cardul, prin Stripe. Nu livrăm ramburs.
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
