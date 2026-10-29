"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";

const REFRESH_MS = 15_000;

/**
 * Keeps the tracking page live (re-renders the server page while the tab is visible) and empties the cart
 * once, when the customer lands here straight after paying.
 */
export function OrderLive({ active, justPlaced }: { active: boolean; justPlaced: boolean }) {
  const router = useRouter();
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    if (!justPlaced) return;
    clear();
    const url = new URL(window.location.href);
    url.searchParams.delete("nou");
    window.history.replaceState(null, "", url);
  }, [justPlaced, clear]);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [active, router]);

  if (!active) return null;
  return (
    <p className="flex items-center gap-2 text-xs text-muted">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-accent" />
      </span>
      Live din atelier · se actualizează automat
    </p>
  );
}
