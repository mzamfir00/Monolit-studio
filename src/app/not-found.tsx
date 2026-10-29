import Link from "next/link";
import { BranchShell } from "@/components/shell/BranchShell";

export default function NotFound() {
  return (
    <BranchShell atelier="umbrella">
      <section className="mx-auto grid max-w-3xl gap-6 px-4 py-32 text-center sm:px-6">
        <p className="eyebrow text-metal-text">404 · Pagină negăsită</p>
        <h1 className="display text-h2">Această piesă nu există în atelier.</h1>
        <p className="text-muted">Poate a fost mutată în alt atelier. Alege unul din bara de sus sau întoarce-te la început.</p>
        <Link href="/" className="btn btn-primary mx-auto">
          Înapoi la Maison Gravure
        </Link>
      </section>
    </BranchShell>
  );
}
