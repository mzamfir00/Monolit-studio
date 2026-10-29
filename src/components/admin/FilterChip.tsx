import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

/** A filter link styled as a pill; the active one is filled. */
export function FilterChip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active ? "border-ink bg-ink text-bg" : "border-line bg-bg text-muted hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
