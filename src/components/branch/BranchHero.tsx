import Link from "next/link";
import { ArrowRight, PawPrint } from "lucide-react";
import { ProductVisual } from "@/components/product/ProductVisual";
import { ATELIERS } from "@/lib/branches";
import { formatMm, formatNumber, formatRon } from "@/lib/format";
import type { Branch, CatalogProduct } from "@/lib/types";
import { ENGRAVING_METHODS, MACHINES, MATERIAL_LABELS } from "@/lib/workshop";
import { AccentTitle, Crosshairs, Stamp, pad2, productHref, toRoman } from "./primitives";

interface HeroProps {
  branch: Branch;
  /** The atelier's signature piece. */
  product: CatalogProduct;
  /** The whole collection, for heroes that show more than one piece. */
  products: CatalogProduct[];
}

/** MAISON PEDIGREE — warm magazine split, signature tag in an arch with a rotating lifetime seal. */
function PetHero({ branch, product }: HeroProps) {
  const atelier = ATELIERS[branch];
  const pills = [
    `${MATERIAL_LABELS[product.material]} ${formatMm(product.depthMm)}`,
    "Zero zăngănit",
    product.engravingMethod === "ROTARY_MILLING" ? `Gravură adâncă ${formatMm(product.engraveDepthMm)}` : "Linie fină de diamant",
  ];
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="grid animate-rise content-start gap-7">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-dashed border-accent/25 bg-panel px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            <PawPrint className="size-3.5 text-metal" aria-hidden="true" />
            Atelier Pedigree • București
          </p>
          <h1 className="display text-hero">
            <AccentTitle text={atelier.heroTitle} accent={atelier.heroAccent} className="italic text-metal-text" />
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted">{atelier.heroLead}</p>
          <ul className="flex flex-wrap gap-2.5" aria-label="Pe scurt">
            {pills.map((pill) => (
              <li
                key={pill}
                className="rounded-full border border-accent/20 bg-panel px-4 py-2 text-sm font-medium text-accent shadow-sm"
              >
                {pill}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={`${atelier.href}#colectia`} className="btn btn-primary">
              Vezi colecția
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href={`${atelier.href}#tehnica`} className="btn btn-ghost">
              Cum gravăm
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md pt-6">
          <Link
            href={productHref(product)}
            className="group block rounded-t-full rounded-b-3xl border border-accent/15 bg-panel p-3 shadow-[0_40px_70px_-40px_rgb(27_59_43/0.55)] transition-transform duration-500 hover:-translate-y-1"
          >
            <div className="stitch overflow-hidden rounded-t-full rounded-b-[1.25rem] bg-surface pt-16">
              <ProductVisual
                product={product}
                showDimensions
                className="w-full text-muted transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 pb-2 pt-4">
              <span className="display text-xl">{product.name}</span>
              <span className="shrink-0 font-semibold text-accent">{formatRon(product.priceBani)}</span>
            </div>
          </Link>
          <Stamp
            id="pet-hero-stamp"
            text="GARANȚIE PE VIAȚĂ • GRAVURĂ MECANICĂ • "
            className="absolute -right-3 top-0 size-32 drop-shadow-lg sm:-right-8 sm:size-36"
          />
        </div>
      </div>
    </section>
  );
}

/** MAISON AURUM — museum-quiet centred title over an asymmetric, razor-edged diptych. */
function JewelryHero({ branch, product, products }: HeroProps) {
  const atelier = ATELIERS[branch];
  const companion = products.find((other) => other.slug !== product.slug);
  const frames = [product, companion].filter((piece): piece is CatalogProduct => Boolean(piece));
  return (
    <section className="border-b-[0.5px] border-line">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 text-center sm:px-6 lg:pb-28 lg:pt-28">
        <div className="animate-rise">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-muted">
            I • {toRoman(new Date().getFullYear())} — Haute gravure au diamant
          </p>
          <h1 className="display mx-auto mt-10 max-w-5xl text-5xl leading-[0.98] md:text-7xl lg:text-[5.5rem]">
            <AccentTitle text={atelier.heroTitle} accent={atelier.heroAccent} className="italic" />
          </h1>
          <span aria-hidden="true" className="mx-auto my-10 block h-px w-16 bg-accent" />
          <p className="mx-auto max-w-xl leading-relaxed text-muted">{atelier.heroLead}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-x-12 gap-y-4 text-[11px] uppercase tracking-[0.28em]">
            <Link
              href={`${atelier.href}#colectia`}
              className="border-b-[0.5px] border-ink pb-1.5 hover:border-accent hover:text-metal-text"
            >
              Descoperă colecția ⟶
            </Link>
            <Link
              href={`${atelier.href}#tehnica`}
              className="border-b-[0.5px] border-transparent pb-1.5 text-muted hover:border-ink hover:text-ink"
            >
              Linia de diamant
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl grid-cols-12 items-start gap-5 sm:gap-10">
          {frames.map((piece, index) => (
            <Link
              key={piece.slug}
              href={productHref(piece)}
              className={index === 0 ? "group col-span-12 sm:col-span-7" : "group col-span-12 sm:col-span-5 sm:mt-32"}
            >
              <figure>
                <div
                  className={`relative flex items-center justify-center border-[0.5px] border-line bg-panel transition-colors duration-500 group-hover:border-accent ${index === 0 ? "aspect-[3/4]" : "aspect-[4/5]"}`}
                >
                  <span aria-hidden="true" className="absolute inset-3 border-[0.5px] border-accent/60 sm:inset-4" />
                  <ProductVisual product={piece} className="w-[82%] transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
                <figcaption className="mt-5 flex items-baseline justify-between gap-4 text-left text-[10px] uppercase tracking-[0.25em] text-muted">
                  <span>
                    Fig. {toRoman(index + 1)} — {piece.name}
                  </span>
                  <span className="shrink-0 text-ink">{formatRon(piece.priceBani)}</span>
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** THE BRASS VAULT — CNC heads-up display: telemetry strip, heavy headline, blueprint frame with rulers. */
function VaultHero({ branch, product }: HeroProps) {
  const atelier = ATELIERS[branch];
  const telemetry: Array<[string, string]> = [
    ["SYS", "GRAVOGRAPH M20 CNC"],
    ["TOLERANȚĂ", "±0,01 MM"],
    ["ADÂNCIME", "FREZARE ROTATIVĂ"],
    ["MAT", "INOX 316L & ALAMĂ C360"],
  ];
  const readouts: Array<[string, string]> = [
    ["COTE", `${formatNumber(product.widthMm)}×${formatNumber(product.heightMm)}×${formatNumber(product.depthMm)} MM`],
    ["ZONĂ", `${formatNumber(product.engraveWidthMm)}×${formatNumber(product.engraveHeightMm)} MM`],
    ["ADÂNCIME", `${formatNumber(product.engraveDepthMm)} MM`],
  ];
  return (
    <section className="relative border-b border-line">
      <div className="border-b border-line bg-bg/85 backdrop-blur">
        <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] sm:px-6">
          <span className="flex shrink-0 items-center gap-2 text-accent">
            <span aria-hidden="true" className="size-1.5 animate-blink rounded-full bg-accent" />
            Online
          </span>
          {telemetry.map(([key, value]) => (
            <span key={key} className="shrink-0 text-muted">
              <span aria-hidden="true" className="pr-5 text-line-strong">
                {"//"}
              </span>
              {key}: <span className="text-ink">{value}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
        <div className="grid animate-rise content-start gap-7 lg:col-span-6">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">[ VLT/01 ] — {atelier.eyebrow}</p>
          <h1 className="display text-hero font-bold">
            <AccentTitle text={atelier.heroTitle} accent={atelier.heroAccent} className="molten" />
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">{atelier.heroLead}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`${atelier.href}#colectia`} className="btn btn-primary">
              Deschide inventarul
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href={`${atelier.href}#tehnica`} className="btn btn-ghost">
              Specificații tehnice
            </Link>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-line border border-line font-mono text-[11px] uppercase">
            {[
              ["Flotă", "3 × M20"],
              ["Mașină", MACHINES[product.recommendedMachine].shortLabel],
              ["Metodă", ENGRAVING_METHODS[product.engravingMethod].shortLabel],
            ].map(([term, value]) => (
              <div key={term} className="grid gap-1 px-3 py-3">
                <dt className="text-muted">{term}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <Link
          href={productHref(product)}
          className="group relative block border border-line bg-surface/90 p-5 sm:p-8 lg:col-span-6"
        >
          <Crosshairs className="text-accent" />
          <div aria-hidden="true" className="ruler-x absolute inset-x-8 top-0" />
          <div aria-hidden="true" className="ruler-y absolute inset-y-8 left-0" />
          <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            <span>DWG // {product.blankSku}</span>
            <span>Scara 1:1 · Rev. A</span>
          </div>
          <div className="texture relative mt-4 border border-dashed border-line-strong bg-bg">
            <ProductVisual product={product} showDimensions className="w-full text-muted" />
          </div>
          <dl className="mt-5 grid gap-2 font-mono text-[11px] uppercase sm:grid-cols-3">
            {readouts.map(([term, value]) => (
              <div
                key={term}
                className="border border-accent/60 bg-bg px-3 py-2 shadow-[0_0_22px_-8px_var(--b-accent)] transition-shadow group-hover:shadow-[0_0_26px_-4px_var(--b-accent)]"
              >
                <dt className="text-accent">{term}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
            <span className="display text-lg">{product.name}</span>
            <span className="shrink-0 font-mono text-base font-bold text-accent">{formatRon(product.priceBani)}</span>
          </p>
        </Link>
      </div>
    </section>
  );
}

/** MAISON BESPOKE — a hospitality specification sheet: exposed 1px grid, headline cell, live volume tiers. */
function CorporateHero({ branch, product }: HeroProps) {
  const atelier = ATELIERS[branch];
  const tiers = product.volumeTiers;
  const unit = (discount: number) => formatRon(Math.round((product.priceBani * (100 - discount)) / 100));
  const range = (index: number) => {
    const next = tiers[index + 1];
    return next ? `${tiers[index].minQuantity}–${next.minQuantity - 1} buc.` : `${tiers[index].minQuantity}+ buc.`;
  };
  return (
    <section className="border-b border-grid">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid border-x border-grid lg:grid-cols-[3fr_2fr]">
          <div className="col-span-full grid grid-cols-3 border-b border-grid font-mono text-[11px] uppercase tracking-[0.12em]">
            <span className="border-r border-grid px-4 py-3">Catalog {new Date().getFullYear()}</span>
            <span className="border-r border-grid px-4 py-3">Spec. B2B</span>
            <span className="px-4 py-3">HoReCa & cabane</span>
          </div>

          <div className="grid content-between gap-12 border-b border-grid p-6 sm:p-10 lg:border-b-0 lg:border-r">
            <div className="grid animate-rise gap-8">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
                Cabane montane · Hoteluri boutique · Protocol executiv
              </p>
              <h1 className="display text-hero">
                <AccentTitle text={atelier.heroTitle} accent={atelier.heroAccent} className="text-accent" />
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted">{atelier.heroLead}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`${atelier.href}#colectia`} className="btn btn-primary">
                Vezi catalogul
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href={`${atelier.href}#volum`} className="btn btn-ghost">
                Calculator de volum
              </Link>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="grid gap-1 border-b border-grid p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Tarife de volum · live</p>
              <p className="font-semibold">
                {product.name} · bază {formatRon(product.priceBani)} / buc.
              </p>
            </div>
            <dl>
              {tiers.map((tier, index) => (
                <div
                  key={tier.minQuantity}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-grid px-6 py-4 transition-colors hover:bg-panel"
                >
                  <dt className="font-mono text-sm uppercase">{range(index)}</dt>
                  <dd className="display text-2xl text-accent">−{tier.discountPercent}%</dd>
                  <dd className="col-span-2 text-sm text-muted">{unit(tier.discountPercent)} / buc.</dd>
                </div>
              ))}
            </dl>
            <p className="flex-1 bg-ink p-6 text-panel">
              <span className="block font-mono text-[11px] uppercase tracking-[0.12em] opacity-70">Capacitate flotă</span>
              <span className="mt-1 block text-lg font-semibold">3 × Gravograph M20 în paralel</span>
            </p>
          </div>

          <Link
            href={productHref(product)}
            className="group col-span-full grid border-t border-grid sm:grid-cols-[2fr_1fr_1fr] sm:divide-x sm:divide-grid"
          >
            <div className="texture flex items-center justify-center bg-panel p-4">
              <ProductVisual product={product} showDimensions className="w-full max-w-md text-muted" />
            </div>
            {[
              [
                "Semifabricat",
                product.blankSku,
                `${MATERIAL_LABELS[product.material]} · ${formatMm(product.widthMm, product.heightMm, product.depthMm)}`,
              ],
              [
                "Mașină",
                MACHINES[product.recommendedMachine].shortLabel,
                `${ENGRAVING_METHODS[product.engravingMethod].label} · ${product.leadTimeDays} zile`,
              ],
            ].map(([label, value, detail], index) => (
              <div
                key={label}
                className="grid content-between gap-6 border-t border-grid p-6 transition-colors group-hover:bg-panel sm:border-t-0"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                  {pad2(index + 2)} — {label}
                </span>
                <span className="grid gap-2">
                  <span className="display text-xl">{value}</span>
                  <span className="text-sm text-muted">{detail}</span>
                </span>
              </div>
            ))}
          </Link>
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
