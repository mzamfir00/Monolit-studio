import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { BranchHero } from "@/components/storefront/BranchHero";
import { CraftSection, OtherAteliers, PillarStrip } from "@/components/storefront/BranchSections";
import { VolumeCalculator } from "@/components/storefront/VolumeCalculator";
import { ATELIERS, isBranch } from "@/lib/branches";
import { getProduct, getProductsByBranch } from "@/lib/catalog";

export default async function BranchStorefront({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  if (!isBranch(branch)) notFound();
  const atelier = ATELIERS[branch];
  const products = getProductsByBranch(branch);
  const hero = getProduct(branch, atelier.heroProductSlug!) ?? products[0];
  const tiered = products.filter((product) => product.volumeTiers.length > 0);

  return (
    <>
      <BranchHero branch={branch} product={hero} />
      <PillarStrip branch={branch} />

      <section id="colectia" className="scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-metal-text">{products.length} piese · gravate la comandă</p>
              <h2 className="display mt-4 text-h2">{atelier.collectionTitle}</h2>
            </div>
            <p className="max-w-md text-muted">{atelier.collectionLead}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      {tiered.length > 0 && (
        <section id="volum" className="scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-24">
            <div className="mb-10 max-w-2xl">
              <p className="eyebrow text-metal-text">Calculator de volum</p>
              <h2 className="display mt-4 text-h2">Cu cât seria e mai mare, cu atât piesa costă mai puțin.</h2>
            </div>
            <VolumeCalculator
              products={tiered.map(({ slug, name, priceBani, volumeTiers }) => ({ slug, name, priceBani, volumeTiers }))}
            />
          </div>
        </section>
      )}

      <CraftSection branch={branch} products={products} />
      <OtherAteliers current={branch} />
    </>
  );
}
