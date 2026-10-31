"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Package } from "lucide-react";
import { cn } from "@/lib/format";

const LINKS = [
  { href: "/contul-meu/comenzi", label: "Comenzile mele", icon: Package },
  { href: "/contul-meu/profil", label: "Datele mele & adresă", icon: MapPin },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Contul meu" className="no-scrollbar flex gap-1 overflow-x-auto lg:grid">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-branch px-3 py-2.5 text-sm transition-colors",
              active ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface hover:text-ink",
            )}
          >
            <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
