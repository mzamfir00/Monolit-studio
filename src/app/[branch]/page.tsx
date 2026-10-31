import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BranchHero } from "@/components/branch/BranchHero";
import { BranchProductGrid } from "@/components/branch/BranchProductCard";
import { BranchHeading, BranchPillars, CraftSection, OtherAteliers } from "@/components/branch/BranchSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { VolumeCalculator } from "@/components/storefront/VolumeCalculator";
import { ATELIERS, isBranch } from "@/lib/branches";
import { getProduct, getProductsByBranch } from "@/lib/server/catalog";
import { pageMetadata } from "@/lib/site";
import { breadcrumbLd, collectionLd } from "@/lib/structured-data";

// Rendered per request from the cached catalogue, so admin edits show without a rebuild.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ branch: string }> }): Promise<Metadata> {
  const { branch } = await params;
  if (!isBranch(branch)) return {};
  const atelier = ATELIERS[branch];
  return pageMetadata({
    title: `${atelier.seoTitle} · ${atelier.name}`,
    absoluteTitle: true,
    description: atelier.seoDescription,
    path: atelier.href,
  });
}

export default async function BranchStorefront({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  if (!isBranch(branch)) notFound();
  const atelier = ATELIERS[branch];
  const products = await getProductsByBranch(branch);
  const hero = (await getProduct(branch, atelier.heroProductSlug!)) ?? products[0];
  const tiered = products.filter((product) => product.volumeTiers.length > 0);

  // Numbered sections (01 / 04): collection, volume calculator when the atelier sells in series, craft, siblings.
  const total = tiered.length > 0 ? 4 : 3;
  const craftIndex = tiered.length > 0 ? 3 : 2;

  return (
    <>
      <JsonLd
        data={[
          collectionLd(branch, products),
          breadcrumbLd([
            ["Maison Gravure", "/"],
            [atelier.name, atelier.href],
          ]),
        ]}
      />
      {hero ? (
        <BranchHero branch={branch} product={hero} products={products} />
      ) : (
        <section className="border-b border-line">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-24 sm:px-6">
            <p className="eyebrow text-metal-text">{atelier.eyebrow}</p>
            <h1 className="display text-hero">{atelier.heroTitle}</h1>
            <p className="max-w-xl text-lg text-muted">Colecția acestui atelier se pregătește. Revino în curând.</p>
          </div>
        </section>
      )}
      <BranchPillars branch={branch} />

      <section id="colectia" className="scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <BranchHeading
            branch={branch}
            index={1}
            total={total}
            eyebrow={`${products.length} piese · gravate la comandă`}
            title={atelier.collectionTitle}
            lead={atelier.collectionLead}
          />
          <BranchProductGrid branch={branch} products={products} />
        </div>
      </section>

      {tiered.length > 0 && (
        <section id="volum" className="scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-24">
            <BranchHeading
              branch={branch}
              index={2}
              total={total}
              eyebrow="Calculator de volum"
              title="Cu cât seria e mai mare, cu atât piesa costă mai puțin."
            />
            <VolumeCalculator
              products={tiered.map(({ slug, name, priceBani, volumeTiers }) => ({ slug, name, priceBani, volumeTiers }))}
            />
          </div>
        </section>
      )}

      <CraftSection branch={branch} products={products} index={craftIndex} total={total} />
      <OtherAteliers current={branch} index={total} total={total} />
    </>
  );
}
