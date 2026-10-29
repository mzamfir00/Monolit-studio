// Domain types shared by the storefront, the seed and (later) the admin portal.
// String unions mirror the Prisma enums in prisma/schema.prisma so client bundles never import the Prisma runtime.

export const BRANCHES = ["pet", "jewelry", "vault", "corporate"] as const;
export type Branch = (typeof BRANCHES)[number];

/** A themed atelier: the umbrella hub plus the four commercial branches. */
export type Atelier = "umbrella" | Branch;

export type Machine = "M20_NEW_GEN" | "M20_OLD_GEN_1" | "M20_OLD_GEN_2";
export type EngravingMethod = "DIAMOND_DRAG" | "ROTARY_MILLING";
export type Material = "BRASS" | "STAINLESS_316L" | "SILVER_925" | "TITANIUM" | "LEATHER" | "WOOD" | "CERAMIC";

export type SymbolSet = "pet" | "jewelry" | "edc";

/** SVG renderers in src/components/product/ProductVisual.tsx. */
export type ProductVisualKey =
  | "hex-tag"
  | "bowl-stand"
  | "collar"
  | "coin-pendant"
  | "cufflinks"
  | "spoon"
  | "lighter"
  | "cardholder"
  | "flask"
  | "keyfob"
  | "plaque"
  | "nameplate";

export interface ProductVariant {
  name: string;
  material: Material;
  /** Finish colour for the configurator swatch. */
  swatch: string;
  priceDeltaBani: number;
  isDefault: boolean;
}

export interface VolumeTier {
  minQuantity: number;
  discountPercent: number;
}

/** Field names match the Prisma `Product` model one-to-one. */
export interface CatalogProduct {
  slug: string;
  branch: Branch;
  name: string;
  subtitle: string;
  description: string;
  priceBani: number;
  highlights: string[];
  isFeatured: boolean;
  sortOrder: number;
  visual: ProductVisualKey;
  sampleEngraving: string[];

  widthMm: number;
  heightMm: number;
  depthMm: number;
  weightGrams: number;

  blankSku: string;
  material: Material;
  engraveWidthMm: number;
  engraveHeightMm: number;
  engraveDepthMm: number;
  recommendedMachine: Machine;
  engravingMethod: EngravingMethod;
  toolRecommendation: string;
  maxCharsPerLine: number;
  maxLines: number;
  /** Placeholder per front line in the configurator, e.g. "Numele câinelui". */
  frontLineHints: string[];
  backLineHints: string[];
  backEngravingAvailable: boolean;
  backEngravingPriceBani: number;
  symbolSets: SymbolSet[];
  stockQuantity: number;
  lowStockThreshold: number;
  leadTimeDays: number;

  variants: ProductVariant[];
  volumeTiers: VolumeTier[];
}
