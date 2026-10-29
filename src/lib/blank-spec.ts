// Physical spec of the blank a piece was sold on, snapshotted on each OrderItem so that job sheets and
// Gravostyle exports keep the dimensions of the sale even if the product is edited later.

import type { CatalogProduct, EngravingMethod, Material, ProductVisualKey } from "./types";

export interface BlankSpec {
  visual: ProductVisualKey;
  material: Material;
  blankSku: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  weightGrams: number;
  engraveWidthMm: number;
  engraveHeightMm: number;
  engraveDepthMm: number;
  engravingMethod: EngravingMethod;
  toolRecommendation: string;
}

export function blankSpecOf(product: CatalogProduct): BlankSpec {
  return {
    visual: product.visual,
    material: product.material,
    blankSku: product.blankSku,
    widthMm: product.widthMm,
    heightMm: product.heightMm,
    depthMm: product.depthMm,
    weightGrams: product.weightGrams,
    engraveWidthMm: product.engraveWidthMm,
    engraveHeightMm: product.engraveHeightMm,
    engraveDepthMm: product.engraveDepthMm,
    engravingMethod: product.engravingMethod,
    toolRecommendation: product.toolRecommendation,
  };
}

/** Reads a stored snapshot; null when the JSON is missing or malformed (orders placed before snapshots). */
export function parseBlankSpec(value: unknown): BlankSpec | null {
  if (typeof value !== "object" || value === null) return null;
  const spec = value as Record<string, unknown>;
  const numbers = ["widthMm", "heightMm", "depthMm", "engraveWidthMm", "engraveHeightMm", "engraveDepthMm"] as const;
  if (typeof spec.visual !== "string" || numbers.some((key) => typeof spec[key] !== "number" || !(Number(spec[key]) > 0))) {
    return null;
  }
  return spec as unknown as BlankSpec;
}
