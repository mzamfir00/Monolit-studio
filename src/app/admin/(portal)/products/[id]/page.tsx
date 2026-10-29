import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/ProductControls";
import { ProductForm } from "@/components/admin/ProductForm";
import { formatDayTime } from "@/lib/admin-ui";
import { ATELIERS } from "@/lib/branches";
import { getAdminProduct } from "@/lib/server/admin-products";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getAdminProduct((await params).id);
  return { title: product ? product.input.name : "Produs" };
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ nou?: string }>;
}) {
  const [{ id }, { nou }] = await Promise.all([params, searchParams]);
  const product = await getAdminProduct(id);
  if (!product) notFound();
  const { input, orderItems } = product;

  return (
    <div className="grid gap-8">
      <header className="grid gap-3">
        <Link href="/admin/products" className="flex w-fit items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Toate produsele
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <p className="eyebrow text-metal-text">
              {ATELIERS[input.branch].name} · {input.blankSku}
            </p>
            <h1 className="display text-h2">{input.name}</h1>
            <p className="text-sm text-muted">
              Creat {formatDayTime(product.createdAt)} · modificat {formatDayTime(product.updatedAt)} ·{" "}
              {orderItems === 0 ? "nicio piesă vândută" : `${orderItems} ${orderItems === 1 ? "piesă vândută" : "piese vândute"}`}
            </p>
          </div>
          <Link href={`/admin/products/new?din=${id}`} className="btn btn-ghost min-h-10 px-4">
            <Copy className="size-4" aria-hidden="true" />
            Duplică
          </Link>
        </div>
      </header>

      {nou && (
        <p role="status" className="rounded-branch border border-line bg-surface px-4 py-3 text-sm">
          Produsul a fost creat{input.isActive ? " și apare deja în magazin" : "; activează-l când e gata de vânzare"}.
        </p>
      )}

      <ProductForm productId={id} initial={input} />

      <section aria-labelledby="zona-stergere" className="grid gap-3 rounded-branch-lg border border-line p-5 sm:p-6">
        <h2 id="zona-stergere" className="text-base font-semibold">
          Scoaterea din catalog
        </h2>
        {orderItems === 0 ? (
          <>
            <p className="text-sm text-muted">Produsul nu a fost comandat niciodată, deci poate fi șters definitiv.</p>
            <DeleteProductButton productId={id} name={input.name} />
          </>
        ) : (
          <p className="text-sm text-muted">
            Produsul apare în comenzi, iar fișele și exporturile SVG ale acelor piese trebuie să rămână valabile, deci nu se poate
            șterge. Debifează „Activ în magazin” ca să-l ascunzi.
          </p>
        )}
      </section>
    </div>
  );
}
