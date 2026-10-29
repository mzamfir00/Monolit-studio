import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BranchMark } from "@/components/shell/BranchMark";
import { isAdminConfigured } from "@/lib/server/owner-credentials";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Autentificare atelier", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  if ((await auth())?.user) redirect("/admin");
  const { callbackUrl } = await searchParams;
  return (
    <div data-branch="umbrella" className="branch-shell texture flex min-h-dvh items-center justify-center px-4 py-16">
      <main className="grid w-full max-w-sm gap-8 rounded-branch-lg border border-line bg-bg p-8 shadow-sm">
        <div className="grid justify-items-center gap-3 text-center">
          <BranchMark atelier="umbrella" className="size-12 text-metal" />
          <p className="wordmark text-lg">Maison Gravure</p>
          <h1 className="eyebrow text-muted">Atelierul · acces proprietar</h1>
        </div>
        {isAdminConfigured() ? (
          <LoginForm callbackUrl={callbackUrl ?? "/admin"} />
        ) : (
          <div className="grid gap-3 text-sm">
            <p className="font-medium">Contul de proprietar nu este configurat.</p>
            <p className="text-muted">
              Rulează <code className="font-mono">npm run admin:credentials -- &quot;parola ta&quot;</code> și adaugă în{" "}
              <code className="font-mono">.env</code> liniile afișate, plus <code className="font-mono">ADMIN_EMAIL</code>.
              Repornește apoi serverul.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
