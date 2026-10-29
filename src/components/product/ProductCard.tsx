import Link from "next/link";
import { ATELIERS } from "@/lib/branches";
import { formatMm, formatRon } from "@/lib/format";
import type { CatalogProduct } from "@/lib/types";
import { ENGRAVING_METHODS, MATERIAL_LABELS } from "@/lib/workshop";
import { ProductVisual } from "./ProductVisual";

export function lowestUnitPrice(product: CatalogProduct) {
  const best = Math.max(0, ...product.volumeTiers.map((tier) => tier.discountPercent));
  return Math.round((product.priceBani * (100 - best)) / 100);
}

/** Self-themed card: it carries its own data-branch, so it keeps its identity inside a mixed grid. */
export function ProductCard({ product, showBranch = false }: { product: CatalogProduct; showBranch?: boolean }) {
  const hasTiers = product.volumeTiers.length > 0;
  const lowStock = product.stockQuantity <= product.lowStockThreshold;
  return (
    <Link href={`${ATELIERS[product.branch].href}/produs/${product.slug}`} className="group block h-full">
      <article
        data-branch={product.branch}
        className="flex h-full flex-col overflow-hidden rounded-branch-lg border border-line bg-bg text-ink transition-shadow duration-300 group-hover:shadow-xl"
      >
        <div className="texture relative aspect-square bg-surface">
          <ProductVisual
            product={product}
            className="size-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
            <span className="eyebrow text-muted">{ENGRAVING_METHODS[product.engravingMethod].shortLabel}</span>
            {lowStock && (
              <span className="eyebrow rounded-full bg-bg/80 px-2 py-0.5 text-[10px] text-metal-text">Ultimele bucăți</span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
          <p className="eyebrow text-metal-text">
            {showBranch ? `${ATELIERS[product.branch].name} · ` : ""}
            {MATERIAL_LABELS[product.material]}
          </p>
          <h3 className="display text-card">{product.name}</h3>
          <p className="text-sm text-muted">{product.subtitle}</p>
          <dl className="mt-auto flex items-end justify-between gap-4 border-t border-line pt-4">
            <div>
              <dt className="eyebrow text-[10px] text-muted">Zonă gravură</dt>
              <dd className="font-mono text-sm">{formatMm(product.engraveWidthMm, product.engraveHeightMm)}</dd>
            </div>
            <div className="text-right">
              <dt className="eyebrow text-[10px] text-muted">{hasTiers ? "De la" : "Preț"}</dt>
              <dd className="text-lg font-semibold">
                {formatRon(hasTiers ? lowestUnitPrice(product) : product.priceBani)}
                {hasTiers && <span className="text-xs font-normal text-muted"> / buc.</span>}
              </dd>
            </div>
          </dl>
        </div>
      </article>
    </Link>
  );
}
