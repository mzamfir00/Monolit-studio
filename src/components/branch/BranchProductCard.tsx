import Link from "next/link";
import { ArrowRight, ArrowUpRight, PawPrint } from "lucide-react";
import { lowestUnitPrice } from "@/components/product/ProductCard";
import { ProductVisual } from "@/components/product/ProductVisual";
import { cn, formatMm, formatNumber, formatRon } from "@/lib/format";
import { volumeDiscount } from "@/lib/pricing";
import type { Branch, CatalogProduct } from "@/lib/types";
import { ENGRAVING_METHODS, MATERIAL_LABELS } from "@/lib/workshop";
import { Crosshairs, JEWELRY_CUT, PET_MATERIAL_TAG, VAULT_MACHINE_TAG, corporateCategory, pad2, productHref } from "./primitives";

interface CardProps {
  product: CatalogProduct;
  /** Position in the collection, for indexed systems (Bespoke's N° 01). */
  index: number;
}

const isLowStock = (product: CatalogProduct) => product.stockQuantity <= product.lowStockThreshold;
const hasTiers = (product: CatalogProduct) => product.volumeTiers.length > 0;
const displayPrice = (product: CatalogProduct) => formatRon(hasTiers(product) ? lowestUnitPrice(product) : product.priceBani);

/** Polaroid in cream with a stitched seam, durability tag and a friendly pill CTA. */
function PetProductCard({ product }: CardProps) {
  return (
    <Link href={productHref(product)} className="group block h-full">
      <article className="flex h-full flex-col rounded-3xl border border-accent/15 bg-panel p-3 shadow-sm transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl">
        <div className="relative overflow-hidden rounded-2xl bg-surface">
          <ProductVisual
            product={product}
            className="aspect-square w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-panel/95 px-3 py-1 text-[11px] font-semibold text-accent shadow-sm">
            <PawPrint className="size-3.5 text-metal" aria-hidden="true" />
            {PET_MATERIAL_TAG[product.material]}
          </span>
          {isLowStock(product) && (
            <span className="absolute right-3 top-3 rounded-full bg-metal-text px-3 py-1 text-[11px] font-semibold text-panel">
              Ultimele bucăți
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 px-3 pb-2 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-metal-text">
            {MATERIAL_LABELS[product.material]}
          </p>
          <h3 className="display text-card">{product.name}</h3>
          <p className="text-sm text-muted">{product.subtitle}</p>
          <div className="mt-auto pt-5">
            <div aria-hidden="true" className="border-t-2 border-dashed border-accent/20" />
            <div className="flex items-center justify-between gap-3 pt-4">
              <p>
                <span className="block text-[11px] text-muted">{hasTiers(product) ? "De la" : "Preț"}</span>
                <span className="text-xl font-semibold text-accent">{displayPrice(product)}</span>
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-panel transition-colors group-hover:bg-metal-text">
                Personalizează
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

/** Lookbook frame: no box, no shadow, a hairline that warms to gold; centred caption. */
function JewelryProductCard({ product }: CardProps) {
  return (
    <Link href={productHref(product)} className="group block text-center">
      <div className="relative flex aspect-[3/4] items-center justify-center border border-line bg-panel transition-colors duration-500 group-hover:border-accent">
        <ProductVisual product={product} className="w-[86%] transition-transform duration-700 group-hover:scale-[1.03]" />
        {isLowStock(product) && (
          <span className="absolute inset-x-0 bottom-4 text-[10px] uppercase tracking-[0.25em] text-metal-text">
            Ultimele piese
          </span>
        )}
      </div>
      <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-muted">
        {MATERIAL_LABELS[product.material]} • {JEWELRY_CUT[product.engravingMethod]}
      </p>
      <h3 className="display mt-3 text-xl leading-snug">{product.name}</h3>
      <p className="mt-2 text-sm tracking-wide text-muted">{displayPrice(product)}</p>
      <span className="mt-4 inline-block border-b-[0.5px] border-ink pb-1 text-[10px] uppercase tracking-[0.25em] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        Configurează piesa ⟶
      </span>
    </Link>
  );
}

/** Machined chassis: crosshair corners, SKU / machine header bar and a two-cell spec footer. */
function VaultProductCard({ product }: CardProps) {
  return (
    <Link href={productHref(product)} className="group block h-full">
      <article className="relative flex h-full flex-col border border-line bg-surface transition-colors duration-300 group-hover:border-accent">
        <Crosshairs className="text-line-strong group-hover:text-accent" />
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
          <span className="truncate">SKU // {product.blankSku}</span>
          <span className="shrink-0">{VAULT_MACHINE_TAG[product.engravingMethod]}</span>
        </header>
        <div className="texture relative bg-bg">
          <ProductVisual
            product={product}
            className="aspect-square w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          {isLowStock(product) && (
            <span className="absolute bottom-3 left-3 border border-accent/60 bg-bg px-2 py-1 font-mono text-[10px] uppercase text-accent">
              Stoc: {product.stockQuantity} buc
            </span>
          )}
        </div>
        <div className="grid gap-1.5 border-t border-line px-4 py-4">
          <h3 className="display text-card">{product.name}</h3>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
            {MATERIAL_LABELS[product.material]} · {ENGRAVING_METHODS[product.engravingMethod].shortLabel}
          </p>
        </div>
        <dl className="mt-auto grid grid-cols-2 divide-x divide-line border-t border-line font-mono text-xs uppercase">
          <div className="px-4 py-3">
            <dt className="text-[10px] text-muted">Cote</dt>
            <dd>
              {formatNumber(product.widthMm)}×{formatNumber(product.heightMm)} mm
            </dd>
          </div>
          <div className="px-4 py-3 text-right">
            <dt className="text-[10px] text-muted">{hasTiers(product) ? "De la" : "Preț"}</dt>
            <dd className="text-base font-bold text-accent">{displayPrice(product)}</dd>
          </div>
        </dl>
      </article>
    </Link>
  );
}

/** Unit price against the 25-piece batch price, plus the full tier ladder. */
function TierBar({ product }: { product: CatalogProduct }) {
  if (!hasTiers(product)) {
    return <p className="border border-grid px-3 py-2 font-mono text-[11px] uppercase">Preț fix · fără tranșe</p>;
  }
  const batchDiscount = volumeDiscount(product.volumeTiers, 25);
  const batch = Math.round((product.priceBani * (100 - batchDiscount)) / 100);
  return (
    <div className="grid gap-2">
      <dl className="grid grid-cols-2 border border-grid">
        <div className="border-r border-grid px-3 py-2.5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">1 buc.</dt>
          <dd className="font-semibold">{formatRon(product.priceBani)}</dd>
        </div>
        <div className="bg-ink px-3 py-2.5 text-panel">
          <dt className="font-mono text-[10px] uppercase tracking-[0.1em] opacity-75">25+ buc. · −{batchDiscount}%</dt>
          <dd className="font-semibold">{formatRon(batch)}</dd>
        </div>
      </dl>
      <ol className="flex gap-px" aria-label="Tranșe de volum">
        {product.volumeTiers.map((tier) => (
          <li key={tier.minQuantity} className="grid flex-1 gap-1">
            <span
              aria-hidden="true"
              className="h-1.5 bg-accent"
              style={{
                opacity: 0.25 + (0.75 * tier.discountPercent) / Math.max(...product.volumeTiers.map((t) => t.discountPercent)),
              }}
            />
            <span className="font-mono text-[10px]">
              {tier.minQuantity}+ · −{tier.discountPercent}%
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Seamless grid cell of the Swiss specification sheet; borders are shared with its neighbours. */
function CorporateProductCard({ product, index }: CardProps) {
  return (
    <Link
      href={productHref(product)}
      className="group flex h-full flex-col justify-between gap-6 border-b border-r border-grid bg-bg p-6 transition-colors hover:bg-panel"
    >
      <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.12em]">
        <span>N° {pad2(index + 1)}</span>
        <span className="border border-grid px-2 py-0.5">{corporateCategory(product.visual)}</span>
      </div>
      <div className="texture flex aspect-[4/3] items-center justify-center border border-grid bg-panel">
        <ProductVisual product={product} className="h-full transition-transform duration-700 group-hover:scale-[1.03]" />
      </div>
      <div className="grid gap-2">
        <h3 className="display text-card">{product.name}</h3>
        <p className="text-sm text-muted">{product.subtitle}</p>
      </div>
      <TierBar product={product} />
      <div className="flex items-center justify-between gap-3 border-t border-grid pt-4 font-mono text-[11px] uppercase">
        <span className="truncate text-muted">
          {product.blankSku} · {formatMm(product.engraveWidthMm, product.engraveHeightMm)}
        </span>
        <span className="flex shrink-0 items-center gap-1 font-semibold">
          Specificație
          <ArrowUpRight
            className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

export function BranchProductCard({ branch, ...props }: CardProps & { branch: Branch }) {
  switch (branch) {
    case "pet":
      return <PetProductCard {...props} />;
    case "jewelry":
      return <JewelryProductCard {...props} />;
    case "vault":
      return <VaultProductCard {...props} />;
    case "corporate":
      return <CorporateProductCard {...props} />;
  }
}

const GRID: Record<Branch, string> = {
  pet: "grid gap-7 sm:grid-cols-2 lg:grid-cols-3",
  // Editorial stagger: the middle column of each row drops, like a magazine spread.
  jewelry: "grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:[&>*:nth-child(3n+2)]:mt-20",
  vault: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
  // Parent draws the top/left rules, each cell its right/bottom ones: one continuous 1px grid.
  corporate: "grid border-l border-t border-grid sm:grid-cols-2 lg:grid-cols-3",
};

export function BranchProductGrid({
  branch,
  products,
  className,
}: {
  branch: Branch;
  products: CatalogProduct[];
  className?: string;
}) {
  return (
    <div className={cn(GRID[branch], className)}>
      {products.map((product, index) => (
        <BranchProductCard key={product.slug} branch={branch} product={product} index={index} />
      ))}
    </div>
  );
}
