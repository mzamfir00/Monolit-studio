// Storefront read model. Reads the static dataset so the shop renders without a database;
// swap these bodies for Prisma queries once the admin portal edits the catalogue.

import { products } from "./seed-data";
import type { Branch, CatalogProduct } from "./types";

const bySortOrder = (a: CatalogProduct, b: CatalogProduct) => a.sortOrder - b.sortOrder;

export function getAllProducts(): CatalogProduct[] {
  return products;
}

export function getProductsByBranch(branch: Branch): CatalogProduct[] {
  return products.filter((product) => product.branch === branch).sort(bySortOrder);
}

export function getFeaturedProducts(): CatalogProduct[] {
  return products.filter((product) => product.isFeatured);
}

export function getProduct(branch: Branch, slug: string): CatalogProduct | undefined {
  return products.find((product) => product.branch === branch && product.slug === slug);
}

export function getDefaultVariant(product: CatalogProduct) {
  return product.variants.find((variant) => variant.isDefault) ?? product.variants[0];
}
