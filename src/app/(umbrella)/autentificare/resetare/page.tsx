import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";
import { resetTokenIsValid } from "@/lib/server/customers";

export const metadata: Metadata = { title: "Parolă nouă", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && token.length > 20 && (await resetTokenIsValid(token));
  return (
    <div className="mx-auto grid max-w-md gap-8 px-4 py-16 sm:px-6 lg:py-24">
      <header className="grid gap-3">
        <p className="eyebrow text-metal-text">Contul tău</p>
        <h1 className="display text-h2">Parolă nouă</h1>
      </header>
      {valid ? (
        <div className="rounded-branch-lg border border-line bg-bg p-6 sm:p-9">
          <ResetPasswordForm token={token} />
        </div>
      ) : (
        <div className="grid gap-5 rounded-branch-lg border border-line bg-surface p-6 sm:p-9">
          <p>
            Linkul de resetare a expirat sau a fost deja folosit. Linkurile sunt valabile o oră și pot fi folosite o singură dată.
          </p>
          <Link href="/autentificare?mod=resetare" className="btn btn-primary w-fit">
            Cere un link nou
          </Link>
        </div>
      )}
    </div>
  );
}
