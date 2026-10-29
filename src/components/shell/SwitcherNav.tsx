"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Horizontally scrollable atelier list that brings the current atelier into view on narrow screens. */
export function SwitcherNav({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = ref.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }, []);

  return (
    <nav
      ref={ref}
      aria-label="Ateliere"
      className="no-scrollbar flex min-w-0 flex-1 items-stretch overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-2.5rem),transparent)] lg:[mask-image:none]"
    >
      {children}
    </nav>
  );
}
