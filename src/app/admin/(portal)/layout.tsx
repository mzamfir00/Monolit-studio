import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { BranchMark } from "@/components/shell/BranchMark";
import { requireAdmin } from "@/lib/server/admin-auth";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: { default: "Atelier", template: "%s · Atelier · Maison Gravure" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  return (
    <div data-branch="umbrella" className="branch-shell min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 z-30 flex flex-col gap-4 border-b border-line bg-surface px-4 py-3 lg:h-dvh lg:gap-8 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <BranchMark atelier="umbrella" className="size-8 shrink-0 text-metal" />
          <span className="grid gap-0.5">
            <span className="wordmark text-sm">Maison Gravure</span>
            <span className="eyebrow text-[10px] text-muted">Atelier · M20</span>
          </span>
        </Link>
        <AdminNav />
        <div className="mt-auto hidden gap-3 border-t border-line px-2 pt-4 text-sm lg:grid">
          <p className="truncate text-muted" title={session.user?.email ?? undefined}>
            {session.user?.email}
          </p>
          <Link href="/" className="flex items-center gap-2 text-muted hover:text-ink">
            <ExternalLink className="size-4" aria-hidden="true" />
            Vezi magazinul
          </Link>
          <form action={logout}>
            <button type="submit" className="flex items-center gap-2 text-muted hover:text-ink">
              <LogOut className="size-4" aria-hidden="true" />
              Deconectare
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      <form action={logout} className="border-t border-line px-4 py-4 lg:hidden">
        <button type="submit" className="flex items-center gap-2 text-sm text-muted">
          <LogOut className="size-4" aria-hidden="true" />
          Deconectare ({session.user?.email})
        </button>
      </form>
    </div>
  );
}
