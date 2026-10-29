"use client";

import { ShoppingBag } from "lucide-react";
import { cartCount, useCartStore, useHydrated } from "@/store/useCartStore";

export function CartButton() {
  const hydrated = useHydrated();
  const count = useCartStore((state) => cartCount(state.items));
  const open = useCartStore((state) => state.open);
  const shown = hydrated ? count : 0;

  return (
    <button
      type="button"
      onClick={open}
      aria-haspopup="dialog"
      aria-label={shown > 0 ? `Coșul tău — ${shown} ${shown === 1 ? "piesă" : "piese"}` : "Coșul tău — gol"}
      className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
    >
      <ShoppingBag className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
      {shown > 0 && (
        <span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-4 text-accent-ink">
          {shown}
        </span>
      )}
    </button>
  );
}
