// Price rules for configured engravings. Pure functions, used by the configurator, the cart drawer and,
// later, server-side checkout (which recomputes from the catalogue instead of trusting the client).

import type { EngravingConfig } from "./engraving";
import type { CatalogProduct, VolumeTier } from "./types";

/** Vectorising a customer sketch or logo — charged once per cart line, not per piece. */
export const SKETCH_VECTORIZATION_FEE_BANI = 6900;
/** Rigid workshop box with velvet insert + Mechanical Engraving Certificate, per piece. */
export const GIFT_BOX_FEE_BANI = 5900;

/** Courier delivery with AWB, free from FREE_SHIPPING_FROM_BANI. */
export const SHIPPING_FEE_BANI = 2500;
export const FREE_SHIPPING_FROM_BANI = 50000;

export function shippingFor(subtotalBani: number): number {
  return subtotalBani >= FREE_SHIPPING_FROM_BANI ? 0 : SHIPPING_FEE_BANI;
}

/** Everything needed to re-price a cart line when its quantity changes. */
export interface LinePricing {
  /** Product + finish, before volume discount. */
  baseUnitBani: number;
  /** Back engraving and gift box, per piece (never discounted). */
  extrasUnitBani: number;
  setupFeeBani: number;
  volumeTiers: VolumeTier[];
}

export interface LineQuote {
  discountPercent: number;
  unitBani: number;
  setupFeeBani: number;
  totalBani: number;
  savedBani: number;
}

export function volumeDiscount(tiers: VolumeTier[], quantity: number): number {
  return tiers.reduce((best, tier) => (quantity >= tier.minQuantity ? Math.max(best, tier.discountPercent) : best), 0);
}

export function quoteLine(pricing: LinePricing, quantity: number): LineQuote {
  const discountPercent = volumeDiscount(pricing.volumeTiers, quantity);
  const discountedBase = Math.round((pricing.baseUnitBani * (100 - discountPercent)) / 100);
  const unitBani = discountedBase + pricing.extrasUnitBani;
  return {
    discountPercent,
    unitBani,
    setupFeeBani: pricing.setupFeeBani,
    totalBani: unitBani * quantity + pricing.setupFeeBani,
    savedBani: (pricing.baseUnitBani - discountedBase) * quantity,
  };
}

export function linePricing(product: CatalogProduct, config: EngravingConfig): LinePricing {
  const variant = product.variants.find((candidate) => candidate.name === config.variantName);
  const back = config.sides === "FRONT_AND_BACK" && product.backEngravingAvailable ? product.backEngravingPriceBani : 0;
  return {
    baseUnitBani: product.priceBani + (variant?.priceDeltaBani ?? 0),
    extrasUnitBani: back + (config.giftPackaging ? GIFT_BOX_FEE_BANI : 0),
    setupFeeBani: config.sketch ? SKETCH_VECTORIZATION_FEE_BANI : 0,
    volumeTiers: product.volumeTiers,
  };
}
