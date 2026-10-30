import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductBreadcrumb, ProductDetails, ProductHeader, RelatedProducts } from "@/components/branch/ProductPage";
import { EngravingConfigurator } from "@/components/engraving/EngravingConfigurator";
import { isBranch } from "@/lib/branches";
import { getProduct, getProductsByBranch } from "@/lib/server/catalog";

type Params = Promise<{ branch: string; slug: string }>;

// Rendered per request from the cached catalogue: live stock, and new products need no rebuild.
export const dynamic = "force-dynamic";

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
  const related = (await getProductsByBranch(product.branch)).filter((other) => other.slug !== product.slug);

  return (
    <>
      <ProductBreadcrumb product={product} />
      <EngravingConfigurator product={product} header={<ProductHeader product={product} />} />
      <ProductDetails product={product} />
      <RelatedProducts branch={product.branch} products={related} />
    </>
  );
}
