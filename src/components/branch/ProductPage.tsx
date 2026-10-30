import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Check, ChevronRight, PawPrint } from "lucide-react";
import { lowestUnitPrice } from "@/components/product/ProductCard";
import { ATELIERS } from "@/lib/branches";
import { cn, formatGrams, formatMm, formatRon } from "@/lib/format";
import type { Branch, CatalogProduct } from "@/lib/types";
import { ENGRAVING_METHODS, MACHINES, MATERIAL_LABELS } from "@/lib/workshop";
import { BranchProductGrid } from "./BranchProductCard";
import { BranchHeading } from "./BranchSections";
import { Crosshairs, JEWELRY_CUT, PANEL, VAULT_MACHINE_TAG, corporateCategory } from "./primitives";

// Product detail page wrappers per atelier. The configurator itself is shared (and re-cut in
// src/app/branch-systems.css); these components shape what surrounds it.

const CRUMBS: Record<Branch, { list: string; item: string; separator: ReactNode }> = {
  pet: {
    list: "flex flex-wrap items-center gap-1.5 text-sm text-muted",
    item: "",
    separator: <ChevronRight className="size-3.5" aria-hidden="true" />,
  },
  jewelry: {
    list: "flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-muted",
    item: "",
    separator: <span aria-hidden="true">/</span>,
  },
  vault: {
    list: "flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted",
    item: "",
    separator: (
      <span aria-hidden="true" className="text-accent">
        {"//"}
      </span>
    ),
  },
  corporate: {
    list: "flex flex-wrap border-l border-t border-grid font-mono text-[11px] uppercase tracking-[0.1em]",
    item: "border-b border-r border-grid px-3 py-2",
    separator: null,
  },
};

export function ProductBreadcrumb({ product }: { product: CatalogProduct }) {
  const atelier = ATELIERS[product.branch];
  const style = CRUMBS[product.branch];
  const trail: Array<[string, string | null]> = [
    [atelier.name, atelier.href],
    [atelier.collectionTitle, `${atelier.href}#colectia`],
    [product.name, null],
  ];
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <ol className={style.list}>
        {trail.map(([label, href], index) => (
          <Fragment key={label}>
            {index > 0 && style.separator}
            <li className={cn(style.item, !href && "text-ink")} aria-current={href ? undefined : "page"}>
              {href ? (
                <Link href={href} className="hover:text-ink">
                  {label}
                </Link>
              ) : (
                label
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

/** Name, price and stock above the configurator steps. */
export function ProductHeader({ product }: { product: CatalogProduct }) {
  const atelier = ATELIERS[product.branch];
  const lowStock = product.stockQuantity <= product.lowStockThreshold;
  const seriesNote = product.volumeTiers.length > 0 ? ` · de la ${formatRon(lowestUnitPrice(product))} / buc. în serie` : "";

  switch (product.branch) {
    case "pet":
      return (
        <header className="grid gap-4">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-dashed border-accent/25 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            <PawPrint className="size-3.5 text-metal" aria-hidden="true" />
            {atelier.name} · {MATERIAL_LABELS[product.material]}
          </p>
          <h1 className="display text-h2">{product.name}</h1>
          <p className="text-lg text-muted">{product.subtitle}</p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="display text-3xl text-accent">{formatRon(product.priceBani)}</p>
            <p className="text-sm text-muted">gravura pe față inclusă{seriesNote}</p>
          </div>
          {lowStock && (
            <p className="w-fit rounded-full bg-metal-text px-3.5 py-1 text-xs font-semibold text-panel">
              Mai avem doar {product.stockQuantity} semifabricate în atelier
            </p>
          )}
        </header>
      );
    case "jewelry":
      return (
        <header className="grid gap-5 border-b-[0.5px] border-line pb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted">
            {MATERIAL_LABELS[product.material]} • {JEWELRY_CUT[product.engravingMethod]}
          </p>
          <h1 className="display text-h2">{product.name}</h1>
          <p className="text-lg leading-relaxed text-muted">{product.subtitle}</p>
          <span aria-hidden="true" className="block h-px w-12 bg-accent" />
          <p className="text-sm tracking-[0.18em]">
            {formatRon(product.priceBani)}
            <span className="pl-3 text-[10px] uppercase tracking-[0.25em] text-muted">gravura pe față inclusă{seriesNote}</span>
          </p>
          {lowStock && (
            <p className="text-[10px] uppercase tracking-[0.25em] text-metal-text">
              Ultimele {product.stockQuantity} piese din atelier
            </p>
          )}
        </header>
      );
    case "vault":
      return (
        <header className="grid gap-4">
          <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
            <span>SKU // {product.blankSku}</span>
            <span>{VAULT_MACHINE_TAG[product.engravingMethod]}</span>
            <span className="text-muted">{MACHINES[product.recommendedMachine].shortLabel}</span>
          </p>
          <h1 className="display text-h2">{product.name}</h1>
          <p className="text-lg text-muted">{product.subtitle}</p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y border-line py-3 font-mono">
            <p className="text-2xl font-bold text-accent">{formatRon(product.priceBani)}</p>
            <p className="text-xs uppercase text-muted">Gravură față inclusă{seriesNote}</p>
          </div>
          {lowStock && (
            <p className="flex w-fit items-center gap-2 border border-accent/60 px-2.5 py-1 font-mono text-[11px] uppercase text-accent">
              <span aria-hidden="true" className="size-1.5 animate-blink rounded-full bg-accent" />
              Stoc: {product.stockQuantity} buc // redus
            </p>
          )}
        </header>
      );
    case "corporate":
      return (
        <header className="grid border-l border-t border-grid">
          <div className="grid grid-cols-3 font-mono text-[11px] uppercase tracking-[0.1em]">
            <span className="border-b border-r border-grid px-3 py-2">Spec. B2B</span>
            <span className="truncate border-b border-r border-grid px-3 py-2">{product.blankSku}</span>
            <span className="truncate border-b border-r border-grid px-3 py-2">{corporateCategory(product.visual)}</span>
          </div>
          <div className="grid gap-3 border-b border-r border-grid bg-panel p-5 sm:p-6">
            <h1 className="display text-h2">{product.name}</h1>
            <p className="text-muted">{product.subtitle}</p>
          </div>
          <div className="grid grid-cols-2">
            <p className="grid gap-1 border-b border-r border-grid px-5 py-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">Preț 1 buc. · față inclusă</span>
              <span className="display text-2xl">{formatRon(product.priceBani)}</span>
            </p>
            <p className="grid gap-1 border-b border-r border-grid px-5 py-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                {product.volumeTiers.length > 0 ? "Cel mai bun preț în serie" : "Stoc"}
              </span>
              <span className={cn("display text-2xl", lowStock && "text-accent")}>
                {product.volumeTiers.length > 0 ? formatRon(lowestUnitPrice(product)) : `${product.stockQuantity} buc.`}
              </span>
            </p>
          </div>
          {lowStock && (
            <p className="border-b border-r border-grid bg-ink px-5 py-2 font-mono text-[11px] uppercase text-panel">
              Mai avem doar {product.stockQuantity} semifabricate în atelier
            </p>
          )}
        </header>
      );
  }
}

function specRows(product: CatalogProduct): Array<[string, string]> {
  return [
    ["Material gravat", MATERIAL_LABELS[product.material]],
    ["Dimensiuni", formatMm(product.widthMm, product.heightMm, product.depthMm)],
    ["Greutate", formatGrams(product.weightGrams)],
    ["Zonă de gravură", formatMm(product.engraveWidthMm, product.engraveHeightMm)],
    ["Adâncime gravură", formatMm(product.engraveDepthMm)],
    ["Tehnică", ENGRAVING_METHODS[product.engravingMethod].label],
    ["Mașină", MACHINES[product.recommendedMachine].label],
    ["Text", `până la ${product.maxLines} rânduri × ${product.maxCharsPerLine} caractere`],
    ["Verso", product.backEngravingAvailable ? `disponibil, +${formatRon(product.backEngravingPriceBani)}` : "nu se gravează"],
    ["Execuție", `${product.leadTimeDays} zile lucrătoare de la plată`],
  ];
}

const DETAIL_SKIN: Record<Branch, { section: string; column: string; row: string; tiers: string; tier: string; check: string }> =
  {
    pet: {
      section: "",
      column: cn(PANEL.pet, "grid content-start gap-6 p-8 sm:p-10"),
      row: "grid grid-cols-[9rem_1fr] gap-4 border-b-2 border-dashed border-accent/15 py-3 last:border-0 sm:grid-cols-[10rem_1fr]",
      tiers: "grid grid-cols-2 gap-2 sm:grid-cols-4",
      tier: "grid gap-1 rounded-2xl border border-accent/15 bg-bg p-4",
      check: "text-metal",
    },
    jewelry: {
      section: "border-t-[0.5px] border-line",
      column: "grid content-start gap-6",
      row: "grid grid-cols-[9rem_1fr] gap-4 border-b-[0.5px] border-line py-3.5 sm:grid-cols-[10rem_1fr]",
      tiers: "grid grid-cols-2 border-[0.5px] border-line sm:grid-cols-4",
      tier: "grid gap-1 p-4",
      check: "text-accent",
    },
    vault: {
      section: "border-t border-line",
      column: "relative grid content-start gap-6 border border-line bg-surface p-6 sm:p-8",
      row: "grid grid-cols-[9rem_1fr] gap-4 border-b border-dashed border-line py-2.5 font-mono text-xs uppercase last:border-0 sm:grid-cols-[11rem_1fr]",
      tiers: "grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4",
      tier: "grid gap-1 bg-bg p-4 font-mono",
      check: "text-accent",
    },
    corporate: {
      section: "",
      column: "grid content-start gap-6 border border-grid bg-panel p-6 sm:p-8",
      row: "grid grid-cols-[9rem_1fr] border-b border-grid last:border-0 sm:grid-cols-[11rem_1fr] [&>dt]:border-r [&>dt]:border-grid [&>*]:px-3 [&>*]:py-2.5",
      tiers: "grid grid-cols-2 border-l border-t border-grid sm:grid-cols-4",
      tier: "grid gap-1 border-b border-r border-grid p-4",
      check: "text-accent",
    },
  };

/** "Despre piesă" and the technical sheet, in the atelier's frame. */
export function ProductDetails({ product }: { product: CatalogProduct }) {
  const branch = product.branch;
  const skin = DETAIL_SKIN[branch];
  return (
    <section aria-labelledby="detalii" className={skin.section}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-10">
        <div className={skin.column}>
          {branch === "vault" && <Crosshairs className="text-line-strong" />}
          <h2 id="detalii" className="display text-h2">
            Despre piesă
          </h2>
          <p className="leading-relaxed">{product.description}</p>
          <ul className="grid gap-2.5">
            {product.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-3 text-sm">
                <Check className={cn("mt-0.5 size-4 shrink-0", skin.check)} aria-hidden="true" />
                {highlight}
              </li>
            ))}
          </ul>
          {product.volumeTiers.length > 0 && (
            <div className="grid gap-3">
              <h3 className="eyebrow text-muted">Tranșe de volum</h3>
              <ul className={skin.tiers}>
                {product.volumeTiers.map((tier) => (
                  <li key={tier.minQuantity} className={skin.tier}>
                    <span className="font-mono text-xs text-muted">{tier.minQuantity}+ buc.</span>
                    <span className="font-semibold">
                      {formatRon(Math.round((product.priceBani * (100 - tier.discountPercent)) / 100))}
                    </span>
                    <span className="text-xs text-metal-text">−{tier.discountPercent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className={skin.column}>
          {branch === "vault" && <Crosshairs className="text-line-strong" />}
          <h2 className="eyebrow text-muted">
            {branch === "vault"
              ? `Fișă tehnică // ${product.blankSku}`
              : branch === "corporate"
                ? "Specificație tehnică"
                : "Fișă tehnică"}
          </h2>
          <dl className={cn("grid text-sm", branch === "corporate" ? "border border-grid" : "border-t border-line")}>
            {specRows(product).map(([term, value]) => (
              <div key={term} className={skin.row}>
                <dt className="text-muted">{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

const RELATED_TITLE: Record<Branch, string> = {
  pet: "Din același atelier",
  jewelry: "Din aceeași colecție",
  vault: "Inventar asociat",
  corporate: "Specificații înrudite",
};

export function RelatedProducts({ branch, products }: { branch: Branch; products: CatalogProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <BranchHeading branch={branch} index={2} total={2} eyebrow={ATELIERS[branch].name} title={RELATED_TITLE[branch]} />
      <BranchProductGrid branch={branch} products={products} />
    </section>
  );
}
