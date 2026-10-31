import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductBreadcrumb, ProductDetails, ProductHeader, RelatedProducts } from "@/components/branch/ProductPage";
import { EngravingConfigurator } from "@/components/engraving/EngravingConfigurator";
import { JsonLd } from "@/components/seo/JsonLd";
import { ATELIERS, isBranch } from "@/lib/branches";
import { getProduct, getProductsByBranch } from "@/lib/server/catalog";
import { pageMetadata } from "@/lib/site";
import { breadcrumbLd, productLd, productMetaDescription, productPath } from "@/lib/structured-data";

type Params = Promise<{ branch: string; slug: string }>;

// Rendered per request from the cached catalogue: live stock, and new products need no rebuild.
export const dynamic = "force-dynamic";

async function load(params: Params) {
  const { branch, slug } = await params;
  return isBranch(branch) ? getProduct(branch, slug) : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await load(params);
  return product
    ? pageMetadata({ title: product.name, description: productMetaDescription(product), path: productPath(product) })
    : {};
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await load(params);
  if (!product) notFound();
  const related = (await getProductsByBranch(product.branch)).filter((other) => other.slug !== product.slug);

  const atelier = ATELIERS[product.branch];

  return (
    <>
      <JsonLd
        data={[
          productLd(product),
          breadcrumbLd([
            ["Maison Gravure", "/"],
            [atelier.name, atelier.href],
            [product.name, productPath(product)],
          ]),
        ]}
      />
      <ProductBreadcrumb product={product} />
      <EngravingConfigurator product={product} header={<ProductHeader product={product} />} />
      <ProductDetails product={product} />
      <RelatedProducts branch={product.branch} products={related} />
    </>
  );
}
