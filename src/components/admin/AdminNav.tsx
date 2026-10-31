"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Factory, LayoutDashboard, Package, Receipt, Users } from "lucide-react";
import { cn } from "@/lib/format";

const LINKS = [
  { href: "/admin", label: "Panou", icon: LayoutDashboard },
  { href: "/admin/production", label: "Producție M20", icon: Factory },
  { href: "/admin/orders", label: "Comenzi", icon: Receipt },
  { href: "/admin/products", label: "Produse", icon: Package },
  { href: "/admin/customers", label: "Clienți", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administrare" className="no-scrollbar flex gap-1 overflow-x-auto lg:grid lg:gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
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
            <Icon className="size-4" strokeWidth={1.6} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
