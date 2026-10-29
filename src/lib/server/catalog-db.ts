import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/prisma";
import type { CatalogProduct, ProductVisualKey, SymbolSet } from "@/lib/types";

export const productInclude = {
  variants: { orderBy: { sortOrder: "asc" } },
  volumeTiers: { orderBy: { minQuantity: "asc" } },
} satisfies Prisma.ProductInclude;

export type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

/** Prisma row → the plain, serialisable shape the storefront and pricing code work with. */
export function toCatalogProduct({ variants, volumeTiers, visual, symbolSets, ...row }: ProductRow): CatalogProduct {
  return {
    slug: row.slug,
    branch: row.branch,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    priceBani: row.priceBani,
    highlights: row.highlights,
    isFeatured: row.isFeatured,
    sortOrder: row.sortOrder,
    visual: visual as ProductVisualKey,
    sampleEngraving: row.sampleEngraving,
    widthMm: row.widthMm,
    heightMm: row.heightMm,
    depthMm: row.depthMm,
    weightGrams: row.weightGrams,
    blankSku: row.blankSku,
    material: row.material,
    engraveWidthMm: row.engraveWidthMm,
    engraveHeightMm: row.engraveHeightMm,
    engraveDepthMm: row.engraveDepthMm,
    recommendedMachine: row.recommendedMachine,
    engravingMethod: row.engravingMethod,
    toolRecommendation: row.toolRecommendation,
    maxCharsPerLine: row.maxCharsPerLine,
    maxLines: row.maxLines,
    frontLineHints: row.frontLineHints,
    backLineHints: row.backLineHints,
    backEngravingAvailable: row.backEngravingAvailable,
    backEngravingPriceBani: row.backEngravingPriceBani,
    symbolSets: symbolSets as SymbolSet[],
    stockQuantity: row.stockQuantity,
    lowStockThreshold: row.lowStockThreshold,
    leadTimeDays: row.leadTimeDays,
    variants: variants.map((variant) => ({
      name: variant.name,
      material: variant.material,
      swatch: variant.swatch ?? "#b5945b",
      priceDeltaBani: variant.priceDeltaBani,
      isDefault: variant.isDefault,
    })),
    volumeTiers: volumeTiers.map(({ minQuantity, discountPercent }) => ({ minQuantity, discountPercent })),
  };
}

export interface StoredProduct {
  id: string;
  product: CatalogProduct;
}

/** Active products by slug, read live from PostgreSQL — the authority for prices and stock at checkout. */
export async function loadProducts(slugs: string[]): Promise<Map<string, StoredProduct>> {
  const rows = await db().product.findMany({
    where: { slug: { in: [...new Set(slugs)] }, isActive: true },
    include: productInclude,
  });
  return new Map(rows.map((row) => [row.slug, { id: row.id, product: toCatalogProduct(row) }]));
}
