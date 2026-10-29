import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { EngravingConfigurator } from "@/components/engraving/EngravingConfigurator";
import { ProductCard, lowestUnitPrice } from "@/components/product/ProductCard";
import { ATELIERS, isBranch } from "@/lib/branches";
import { getAllProducts, getProduct, getProductsByBranch } from "@/lib/catalog";
import { formatGrams, formatMm, formatRon } from "@/lib/format";
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

export default async function ProductPage({ params }: { params: Params }) {
  const product = await load(params);
  if (!product) notFound();
  const atelier = ATELIERS[product.branch];
  const related = getProductsByBranch(product.branch).filter((other) => other.slug !== product.slug);
  const lowStock = product.stockQuantity <= product.lowStockThreshold;

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

  const header = (
    <header className="grid gap-4">
      <p className="eyebrow text-metal-text">
        {atelier.name} · {MATERIAL_LABELS[product.material]}
      </p>
      <h1 className="display text-h2">{product.name}</h1>
      <p className="text-lg text-muted">{product.subtitle}</p>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="display text-3xl">{formatRon(product.priceBani)}</p>
        <p className="text-sm text-muted">
          gravura pe față inclusă
          {product.volumeTiers.length > 0 && ` · de la ${formatRon(lowestUnitPrice(product))} / buc. în serie`}
        </p>
      </div>
      {lowStock && (
        <p className="w-fit rounded-full border border-line px-3 py-1 text-xs text-metal-text">
          Mai avem doar {product.stockQuantity} semifabricate în atelier
        </p>
      )}
    </header>
  );

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

      <EngravingConfigurator product={product} header={header} />

      <section aria-labelledby="detalii" className="border-t border-line">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-14">
          <div className="grid content-start gap-6">
            <h2 id="detalii" className="display text-h2">
              Despre piesă
            </h2>
            <p className="leading-relaxed">{product.description}</p>
            <ul className="grid gap-2.5">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-metal" aria-hidden="true" />
                  {highlight}
                </li>
              ))}
            </ul>
            {product.volumeTiers.length > 0 && (
              <div className="grid gap-3">
                <h3 className="eyebrow text-muted">Tranșe de volum</h3>
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
          </div>
          <div className="grid content-start gap-4">
            <h2 className="eyebrow text-muted">Fișă tehnică</h2>
            <dl className="grid border-t border-line text-sm">
              {specs.map(([term, value]) => (
                <div key={term} className="grid grid-cols-[9rem_1fr] gap-4 border-b border-line py-3 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-muted">{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
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
