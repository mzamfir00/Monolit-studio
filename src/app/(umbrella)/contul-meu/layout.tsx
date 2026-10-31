import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(umbrella)/autentificare/actions";
import { AccountNav } from "@/components/account/AccountNav";
import { currentCustomer } from "@/lib/server/customer-auth";

export const metadata: Metadata = {
  title: { default: "Contul meu", template: "%s · Contul meu · Maison Gravure" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  // Each page calls requireCustomer() with its own address, so signing in returns to the page that was asked for.
  const customer = await currentCustomer();
  if (!customer) return children;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="grid gap-2 border-b border-line pb-8">
        <p className="eyebrow text-metal-text">Contul meu</p>
        <h1 className="display text-h2">Bună, {customer.name.split(" ")[0]}.</h1>
        <p className="text-sm text-muted">{customer.email}</p>
      </header>
      <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
        <aside className="grid content-start gap-3 lg:sticky lg:top-20">
          <AccountNav />
          <form action={signOut} className="lg:border-t lg:border-line lg:pt-3">
            <button
              type="submit"
              className="flex items-center gap-3 rounded-branch px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <LogOut className="size-4" strokeWidth={1.5} aria-hidden="true" />
              Deconectare
            </button>
          </form>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
