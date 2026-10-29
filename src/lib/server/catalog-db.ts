import "server-only";
import { db } from "@/lib/prisma";
import type { CatalogProduct, ProductVisualKey, SymbolSet } from "@/lib/types";

export interface StoredProduct {
  id: string;
  product: CatalogProduct;
}

/** Active products by slug, read from PostgreSQL — the authority for prices and stock at checkout. */
export async function loadProducts(slugs: string[]): Promise<Map<string, StoredProduct>> {
  const rows = await db().product.findMany({
    where: { slug: { in: [...new Set(slugs)] }, isActive: true },
    include: { variants: { orderBy: { sortOrder: "asc" } }, volumeTiers: { orderBy: { minQuantity: "asc" } } },
  });
  return new Map(
    rows.map(({ id, variants, volumeTiers, visual, symbolSets, ...row }) => [
      row.slug,
      {
        id,
        product: {
          ...row,
          visual: visual as ProductVisualKey,
          symbolSets: symbolSets as SymbolSet[],
          variants: variants.map((variant) => ({
            name: variant.name,
            material: variant.material,
            swatch: variant.swatch ?? "#b5945b",
            priceDeltaBani: variant.priceDeltaBani,
            isDefault: variant.isDefault,
          })),
          volumeTiers: volumeTiers.map(({ minQuantity, discountPercent }) => ({ minQuantity, discountPercent })),
        },
      },
    ]),
  );
}
