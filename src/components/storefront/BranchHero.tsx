import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductVisual } from "@/components/product/ProductVisual";
import { ATELIERS } from "@/lib/branches";
import { formatGrams, formatMm, formatRon } from "@/lib/format";
import type { Branch, CatalogProduct } from "@/lib/types";
import { ENGRAVING_METHODS, MACHINES, MATERIAL_LABELS } from "@/lib/workshop";

interface HeroProps {
  branch: Branch;
  product: CatalogProduct;
}

function Actions({ branch }: { branch: Branch }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href={`${ATELIERS[branch].href}#colectia`} className="btn btn-primary">
        Vezi colecția
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
      <Link href={`${ATELIERS[branch].href}#tehnica`} className="btn btn-ghost">
        Cum gravăm
      </Link>
    </div>
  );
}

function productHref(product: CatalogProduct) {
  return `${ATELIERS[product.branch].href}/produs/${product.slug}`;
}

/** Pedigree — warm split layout, the signature tag framed in an arch. */
function PetHero({ branch, product }: HeroProps) {
  const atelier = ATELIERS[branch];
  return (
    <section className="texture border-b border-line">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="grid animate-rise gap-8">
          <p className="eyebrow text-metal-text">{atelier.eyebrow}</p>
          <h1 className="display text-hero">{atelier.heroTitle}</h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted">{atelier.heroLead}</p>
          <Actions branch={branch} />
        </div>
        <Link href={productHref(product)} className="group mx-auto grid w-full max-w-md gap-4">
          <div className="overflow-hidden rounded-t-full border border-line bg-surface pt-10">
            <ProductVisual
              product={product}
              showDimensions
              className="w-full text-muted transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </div>
          <div className="flex items-baseline justify-between gap-4 px-2">
            <span className="display text-xl">{product.name}</span>
            <span className="shrink-0 font-semibold">{formatRon(product.priceBani)}</span>
          </div>
        </Link>
      </div>
    </section>
  );
}

/** Aurum — centred editorial, ivory space and hairline gold rules. */
function JewelryHero({ branch, product }: HeroProps) {
  const atelier = ATELIERS[branch];
  const callouts = [
    ["Diametru", formatMm(product.widthMm)],
    ["Grosime", formatMm(product.depthMm)],
    ["Metal", MATERIAL_LABELS[product.material]],
    ["Gravură", ENGRAVING_METHODS[product.engravingMethod].shortLabel],
  ];
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <div className="animate-rise">
          <p className="eyebrow text-metal-text">{atelier.eyebrow}</p>
          <h1 className="display mx-auto mt-8 max-w-5xl text-hero">{atelier.heroTitle}</h1>
          <span aria-hidden="true" className="mx-auto my-10 block h-px w-20 bg-accent" />
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted">{atelier.heroLead}</p>
        </div>
        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,30rem)_1fr]">
          <dl className="hidden gap-8 text-right lg:grid">
            {callouts.slice(0, 2).map(([term, value]) => (
              <div key={term}>
                <dt className="eyebrow text-muted">{term}</dt>
                <dd className="display mt-2 text-2xl">{value}</dd>
              </div>
            ))}
          </dl>
          <Link href={productHref(product)} className="group block border border-line bg-surface">
            <ProductVisual product={product} className="w-full transition-transform duration-700 group-hover:scale-[1.03]" />
          </Link>
          <dl className="hidden gap-8 text-left lg:grid">
            {callouts.slice(2).map(([term, value]) => (
              <div key={term}>
                <dt className="eyebrow text-muted">{term}</dt>
                <dd className="display mt-2 text-2xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="eyebrow mt-8 text-muted">
          {product.name} · {formatRon(product.priceBani)}
        </p>
        <div className="mt-10 flex justify-center">
          <Actions branch={branch} />
        </div>
      </div>
    </section>
  );
}

/** Brass Vault — dark technical spec panel with crosshair corners and mono read-outs. */
function VaultHero({ branch, product }: HeroProps) {
  const atelier = ATELIERS[branch];
  const specs = [
    ["MAT", MATERIAL_LABELS[product.material]],
    ["DIM", formatMm(product.widthMm, product.heightMm, product.depthMm)],
    ["GREUTATE", formatGrams(product.weightGrams)],
    ["GRAVURĂ", `${ENGRAVING_METHODS[product.engravingMethod].shortLabel} · ${formatMm(product.engraveDepthMm)}`],
    ["MAȘINĂ", MACHINES[product.recommendedMachine].shortLabel],
  ];
  return (
    <section className="texture border-b border-line">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:py-24">
        <div className="grid animate-rise gap-8 lg:col-span-7">
          <p className="eyebrow text-metal-text">[ VLT/01 ] — {atelier.eyebrow}</p>
          <h1 className="display text-hero">{atelier.heroTitle}</h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">{atelier.heroLead}</p>
          <Actions branch={branch} />
        </div>
        <Link href={productHref(product)} className="group relative block border border-line bg-surface p-4 lg:col-span-5">
          {[
            "left-0 top-0 border-l border-t",
            "right-0 top-0 border-r border-t",
            "bottom-0 left-0 border-b border-l",
            "bottom-0 right-0 border-b border-r",
          ].map((corner) => (
            <span key={corner} aria-hidden="true" className={`absolute size-4 border-accent ${corner}`} />
          ))}
          <ProductVisual product={product} showDimensions className="w-full text-muted" />
          <dl className="grid gap-1.5 border-t border-line pt-4 font-mono text-xs">
            {specs.map(([term, value]) => (
              <div key={term} className="flex justify-between gap-4">
                <dt className="text-muted">{term}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </Link>
      </div>
    </section>
  );
}

/** Bespoke — architectural grid, numbered blocks and a blueprint panel. */
function CorporateHero({ branch, product }: HeroProps) {
  const atelier = ATELIERS[branch];
  const maxDiscount = Math.max(...product.volumeTiers.map((tier) => tier.discountPercent));
  const maxTier = product.volumeTiers.at(-1);
  const facts = [
    ["01", `−${maxDiscount}%`, `de la ${maxTier?.minQuantity ?? 100} bucăți`],
    ["02", "PJ", "Factură cu CUI și Reg. Com."],
    ["03", MACHINES[product.recommendedMachine].shortLabel, "Mașină dedicată seriilor"],
  ];
  return (
    <section className="texture border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex items-center justify-between border-b border-ink pb-4">
          <p className="eyebrow">{atelier.eyebrow}</p>
          <p className="eyebrow hidden text-muted sm:block">Catalog {new Date().getFullYear()}</p>
        </div>
        <h1 className="display mt-10 max-w-6xl animate-rise text-hero">{atelier.heroTitle}</h1>
        <div className="mt-12 grid gap-px border border-line bg-line lg:grid-cols-12">
          <div className="grid content-between gap-10 bg-bg p-7 sm:p-9 lg:col-span-5">
            <p className="text-lg leading-relaxed text-muted">{atelier.heroLead}</p>
            <Actions branch={branch} />
          </div>
          <Link href={productHref(product)} className="group block bg-surface p-4 lg:col-span-4">
            <ProductVisual product={product} showDimensions className="w-full text-muted" />
            <p className="eyebrow px-2 pb-2 text-muted">{product.name}</p>
          </Link>
          <dl className="grid gap-px bg-line lg:col-span-3">
            {facts.map(([index, value, label]) => (
              <div key={index} className="grid content-center gap-1 bg-bg p-6">
                <dt className="font-mono text-xs text-muted">{index}</dt>
                <dd className="display text-3xl">{value}</dd>
                <dd className="text-sm text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function BranchHero(props: HeroProps) {
  switch (props.branch) {
    case "pet":
      return <PetHero {...props} />;
    case "jewelry":
      return <JewelryHero {...props} />;
    case "vault":
      return <VaultHero {...props} />;
    case "corporate":
      return <CorporateHero {...props} />;
  }
}
