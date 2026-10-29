import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { FilterChip } from "@/components/admin/FilterChip";
import { ActiveToggle, StockInput } from "@/components/admin/ProductControls";
import { ProductVisual } from "@/components/product/ProductVisual";
import { ATELIERS, isBranch } from "@/lib/branches";
import { formatMm, formatRon } from "@/lib/format";
import { listAdminProducts, type ProductListFilter } from "@/lib/server/admin-products";
import { BRANCHES } from "@/lib/types";
import { ENGRAVING_METHODS, MACHINES, MATERIAL_LABELS } from "@/lib/workshop";

export const metadata: Metadata = { title: "Produse" };

type Search = Promise<{ atelier?: string; stare?: string; q?: string; sters?: string }>;

const FILTERS: Array<{ key: ProductListFilter; label: string }> = [
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "low-stock", label: "Stoc redus" },
];

export default async function ProductsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const branch = params.atelier && isBranch(params.atelier) ? params.atelier : undefined;
  const filter = FILTERS.find((candidate) => candidate.key === params.stare)?.key;
  const products = await listAdminProducts({ branch, filter, q: params.q });

  const href = (next: { atelier?: string; stare?: string }) => {
    const query = new URLSearchParams();
    const a = "atelier" in next ? next.atelier : branch;
    const s = "stare" in next ? next.stare : filter;
    if (a) query.set("atelier", a);
    if (s) query.set("stare", s);
    if (params.q) query.set("q", params.q);
    const search = query.toString();
    return `/admin/products${search ? `?${search}` : ""}`;
  };

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <p className="eyebrow text-metal-text">Catalog · semifabricate · parametri M20</p>
          <h1 className="display text-h2">Produse</h1>
        </div>
        <Link href={`/admin/products/new${branch ? `?atelier=${branch}` : ""}`} className="btn btn-primary min-h-10 px-5">
          <Plus className="size-4" aria-hidden="true" />
          Produs nou
        </Link>
      </header>

      {params.sters && (
        <p role="status" className="rounded-branch border border-line bg-surface px-4 py-3 text-sm">
          Produsul a fost șters din catalog.
        </p>
      )}

      <div className="grid gap-3">
        <div role="group" aria-label="Filtru atelier" className="flex flex-wrap gap-2">
          <FilterChip href={href({ atelier: undefined })} active={!branch}>
            Toate atelierele
          </FilterChip>
          {BRANCHES.map((key) => (
            <FilterChip key={key} href={href({ atelier: key })} active={branch === key}>
              {ATELIERS[key].name}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Filtru stare" className="flex flex-wrap gap-2">
            <FilterChip href={href({ stare: undefined })} active={!filter}>
              Toate
            </FilterChip>
            {FILTERS.map(({ key, label }) => (
              <FilterChip key={key} href={href({ stare: key })} active={filter === key}>
                {label}
              </FilterChip>
            ))}
          </div>
          <form role="search" className="flex w-full items-center gap-2 sm:w-auto">
            {branch && <input type="hidden" name="atelier" value={branch} />}
            {filter && <input type="hidden" name="stare" value={filter} />}
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Caută produs</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Nume, adresă sau cod semifabricat"
                className="h-10 w-full rounded-branch border border-line-strong bg-bg pl-9 pr-3 text-sm sm:w-72"
              />
            </label>
            <button type="submit" className="btn btn-ghost min-h-10">
              Caută
            </button>
          </form>
        </div>
      </div>

      <div className="relative overflow-x-auto rounded-branch-lg border border-line bg-bg">
        <table className="w-full min-w-[68rem] text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs text-muted">
            <tr>
              {["Produs", "Semifabricat", "Preț", "Stoc", "M20 · tehnică", "Vândute", "Activ", ""].map((heading, index) => (
                <th key={index} scope="col" className="px-4 py-3 font-medium">
                  {heading || <span className="sr-only">Acțiuni</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted">
                  Niciun produs pentru filtrele alese.
                </td>
              </tr>
            )}
            {products.map(({ id, isActive, orderItems, product }) => {
              const low = product.stockQuantity <= product.lowStockThreshold;
              return (
                <tr key={id} className={isActive ? undefined : "bg-surface/60"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div data-branch={product.branch} className="size-14 shrink-0 rounded-branch bg-surface p-1">
                        <ProductVisual product={product} className="size-full" />
                      </div>
                      <div className="grid min-w-0 gap-0.5">
                        <Link href={`/admin/products/${id}`} className="font-medium hover:underline">
                          {product.name}
                        </Link>
                        <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span
                            data-branch={product.branch}
                            className="eyebrow rounded-full border border-line bg-bg px-2 py-0.5 text-[10px] text-ink"
                          >
                            {ATELIERS[product.branch].shortName}
                          </span>
                          {product.isFeatured && <span className="text-metal-text">Capodoperă</span>}
                          {!isActive && <span>Ascuns din magazin</span>}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs">{product.blankSku}</p>
                    <p className="text-xs text-muted">
                      {MATERIAL_LABELS[product.material]} · gravură {formatMm(product.engraveWidthMm, product.engraveHeightMm)}
                    </p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatRon(product.priceBani)}
                    {product.volumeTiers.length > 0 && <p className="text-xs text-muted">{product.volumeTiers.length} tranșe</p>}
                  </td>
                  <td className="px-4 py-3">
                    <StockInput productId={id} stock={product.stockQuantity} low={low} name={product.name} />
                    {low && <p className="mt-1 text-xs text-metal-text">sub pragul de {product.lowStockThreshold}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p>{MACHINES[product.recommendedMachine].shortLabel}</p>
                    <p className="text-xs text-muted">{ENGRAVING_METHODS[product.engravingMethod].shortLabel}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted">{orderItems}</td>
                  <td className="px-4 py-3">
                    <ActiveToggle productId={id} isActive={isActive} name={product.name} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${id}`}
                      className="inline-flex items-center gap-1.5 rounded-branch border border-line-strong px-2.5 py-1.5 text-xs hover:border-ink"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Editează
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        {products.length} {products.length === 1 ? "produs" : "produse"}. „Vândute” numără piesele comandate; un produs vândut nu
        se poate șterge, doar ascunde.
      </p>
    </div>
  );
}
