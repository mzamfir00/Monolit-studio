import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { db } from "@/lib/prisma";
import type { Branch, CatalogProduct } from "@/lib/types";
import { productInclude, toCatalogProduct } from "./catalog-db";

// Storefront read model. The active catalogue is read from PostgreSQL once and cached under one tag;
// admin edits and paid orders (stock) call invalidateCatalog() so the shop reflects them immediately.

const CATALOG_TAG = "catalog";

const activeProducts = unstable_cache(
  async (): Promise<CatalogProduct[]> => {
    const rows = await db().product.findMany({
      where: { isActive: true },
      include: productInclude,
      orderBy: [{ branch: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map(toCatalogProduct);
  },
  ["catalog:active"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

export async function getProductsByBranch(branch: Branch): Promise<CatalogProduct[]> {
  return (await activeProducts()).filter((product) => product.branch === branch);
}

export async function getFeaturedProducts(): Promise<CatalogProduct[]> {
  return (await activeProducts()).filter((product) => product.isFeatured);
}

export async function getProduct(branch: Branch, slug: string): Promise<CatalogProduct | undefined> {
  return (await activeProducts()).find((product) => product.branch === branch && product.slug === slug);
}

/** Call from server actions and route handlers (not during render) after catalogue or stock changes. */
export function invalidateCatalog() {
  revalidateTag(CATALOG_TAG);
}
