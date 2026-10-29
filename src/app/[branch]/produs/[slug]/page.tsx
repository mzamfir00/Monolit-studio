import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductVisual } from "@/components/product/ProductVisual";
import { ATELIERS, isBranch } from "@/lib/branches";
import { getAllProducts, getDefaultVariant, getProduct, getProductsByBranch } from "@/lib/catalog";
import { formatGrams, formatMm, formatNumber, formatRon } from "@/lib/format";
import { ENGRAVING_METHODS, MACHINES, MATERIAL_LABELS } from "@/lib/workshop";

type Params = Promise<{ branch: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProducts().map(({ branch, slug }) => ({ branch, slug }));
}

async function load(params: Params) {
  const { branch, slug } = await params;
  return isBranch(branch) ? getProduct(branch, slug) : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await load(params);
  return product ? { title: product.name, description: product.subtitle } : {};
}

const CONFIGURATOR_STEPS = [
  "Material și finisaj",
  "Doar față sau față + verso",
  "Tipografie",
  "Textul, rând cu rând",
  "Simbol vectorial",
  "Schiță sau logo propriu",
  "Ambalaj cadou de atelier",
];

export default async function ProductPage({ params }: { params: Params }) {
  const product = await load(params);
  if (!product) notFound();
  const atelier = ATELIERS[product.branch];
  const defaultVariant = getDefaultVariant(product);
  const related = getProductsByBranch(product.branch).filter((other) => other.slug !== product.slug);

  const specs: Array<[string, string]> = [
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

  return (
    <>
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
          <li>
            <Link href={atelier.href} className="hover:text-ink">
              {atelier.name}
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li>
            <Link href={`${atelier.href}#colectia`} className="hover:text-ink">
              {atelier.collectionTitle}
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-14">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="texture rounded-branch-lg border border-line bg-surface p-4 sm:p-8">
            <ProductVisual product={product} showDimensions className="w-full text-muted" />
          </div>
          <p className="mt-3 text-xs text-muted">
            Desen la scară pe baza cotelor semifabricatului. Zona punctată este suprafața gravabilă.
          </p>
        </div>

        <div className="grid content-start gap-8">
          <div className="grid gap-4">
            <p className="eyebrow text-metal-text">{MATERIAL_LABELS[product.material]}</p>
            <h1 className="display text-h2">{product.name}</h1>
            <p className="text-lg text-muted">{product.subtitle}</p>
            <p className="display text-3xl">
              {formatRon(product.priceBani)}
              <span className="ml-2 align-middle font-sans text-sm font-normal normal-case tracking-normal text-muted">
                gravura pe față inclusă
              </span>
            </p>
          </div>

          <p className="leading-relaxed">{product.description}</p>

          <ul className="grid gap-2.5">
            {product.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-3 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-metal" aria-hidden="true" />
                {highlight}
              </li>
            ))}
          </ul>

          <div className="grid gap-3">
            <h2 className="eyebrow text-muted">Finisaje disponibile</h2>
            <ul className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <li
                  key={variant.name}
                  className="rounded-branch border border-line bg-raised px-3 py-2 text-sm"
                  aria-current={variant === defaultVariant ? "true" : undefined}
                >
                  {variant.name}
                  {variant.priceDeltaBani > 0 && <span className="text-muted"> · +{formatRon(variant.priceDeltaBani)}</span>}
                </li>
              ))}
            </ul>
          </div>

          {product.volumeTiers.length > 0 && (
            <div className="grid gap-3">
              <h2 className="eyebrow text-muted">Tranșe de volum</h2>
              <ul className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
                {product.volumeTiers.map((tier) => (
                  <li key={tier.minQuantity} className="grid gap-1 bg-bg p-4">
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

          <div className="grid gap-4 rounded-branch-lg border border-line bg-surface p-6">
            <h2 className="display text-2xl">Personalizarea, pas cu pas</h2>
            <ol className="grid gap-2 text-sm sm:grid-cols-2">
              {CONFIGURATOR_STEPS.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="font-mono text-xs text-metal-text">0{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted">
              Textul se validează după cotele reale ale piesei:{" "}
              <strong className="font-medium text-ink">
                {product.maxLines} rânduri × {product.maxCharsPerLine} caractere
              </strong>{" "}
              pe o zonă de {formatNumber(product.engraveWidthMm)} × {formatNumber(product.engraveHeightMm)} mm.
            </p>
          </div>

          <dl className="grid border-t border-line text-sm">
            {specs.map(([term, value]) => (
              <div key={term} className="grid grid-cols-[10rem_1fr] gap-4 border-b border-line py-3">
                <dt className="text-muted">{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <h2 className="display mb-8 text-h2">Din același atelier</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((other) => (
              <ProductCard key={other.slug} product={other} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
