// Product editor model shared by the admin form (live feedback) and the save action (the authority).
// Prices are bani and dimensions millimetres, as everywhere else in the catalogue.

import { formatNumber, formatRon } from "./format";
import { BRANCHES, type Branch, type CatalogProduct, type Material, type ProductVisualKey, type SymbolSet } from "./types";
import { ENGRAVING_METHODS, MACHINES, MATERIAL_LABELS, machineForBranch } from "./workshop";

/** Renderer choices for ProductVisual, labelled for the editor. */
export const VISUAL_LABELS: Record<ProductVisualKey, string> = {
  "hex-tag": "Medalion hexagonal",
  "bowl-stand": "Suport de boluri cu plăcuță",
  collar: "Zgardă cu plăcuță nituită",
  "coin-pendant": "Bănuț / pandantiv rotund",
  cufflinks: "Pereche de butoni",
  spoon: "Linguriță",
  lighter: "Brichetă",
  cardholder: "Port-card",
  flask: "Ploscă",
  keyfob: "Breloc cu gaură",
  plaque: "Plachetă / trofeu",
  nameplate: "Plăcuță de birou",
};

export const VISUAL_KEYS = Object.keys(VISUAL_LABELS) as ProductVisualKey[];
export const MATERIALS = Object.keys(MATERIAL_LABELS) as Material[];
export const SYMBOL_SETS: SymbolSet[] = ["pet", "jewelry", "edc"];

/** Starting finish colour per material; the owner can repaint each finish. */
export const MATERIAL_SWATCHES: Record<Material, string> = {
  BRASS: "#b5945b",
  STAINLESS_316L: "#a9adb2",
  SILVER_925: "#d8d9db",
  TITANIUM: "#6f7378",
  LEATHER: "#6b4226",
  WOOD: "#8a5a32",
  CERAMIC: "#e7e1d6",
};

/** The configurator offers three text inputs per side. */
export const MAX_ENGRAVE_LINES = 3;
const MAX_VARIANTS = 8;
const MAX_TIERS = 6;
const MAX_HIGHLIGHTS = 8;

export interface ProductInput extends CatalogProduct {
  isActive: boolean;
}

/** Field path → message, e.g. "engraveWidthMm" or "variants.1.name". */
export type ProductErrors = Record<string, string>;

export function emptyProduct(branch: Branch): ProductInput {
  return {
    slug: "",
    branch,
    name: "",
    subtitle: "",
    description: "",
    priceBani: Number.NaN,
    highlights: [],
    isFeatured: false,
    isActive: true,
    sortOrder: 50,
    visual: "hex-tag",
    sampleEngraving: [],
    widthMm: Number.NaN,
    heightMm: Number.NaN,
    depthMm: Number.NaN,
    weightGrams: Number.NaN,
    blankSku: "",
    material: "BRASS",
    engraveWidthMm: Number.NaN,
    engraveHeightMm: Number.NaN,
    engraveDepthMm: Number.NaN,
    recommendedMachine: machineForBranch(branch),
    engravingMethod: "ROTARY_MILLING",
    toolRecommendation: "",
    maxCharsPerLine: 14,
    maxLines: 2,
    frontLineHints: [],
    backLineHints: [],
    backEngravingAvailable: false,
    backEngravingPriceBani: 0,
    symbolSets: [],
    stockQuantity: 0,
    lowStockThreshold: 5,
    leadTimeDays: 3,
    variants: [{ name: "", material: "BRASS", swatch: "#b5945b", priceDeltaBani: 0, isDefault: true }],
    volumeTiers: [],
  };
}

/** "Medalion Hexagonal din Alamă" → "medalion-hexagonal-din-alama" */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

// ── Normalisation: also the shape guard for whatever a server action receives ──────────────────────

type Loose = Record<string, unknown>;
const asObject = (value: unknown): Loose => (value && typeof value === "object" ? (value as Loose) : {});
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const number = (value: unknown) => (typeof value === "number" ? value : Number.NaN);
const round2 = (value: number) => (Number.isFinite(value) ? Math.round(value * 100) / 100 : value);
const lines = (value: unknown, max: number) => (Array.isArray(value) ? value : []).map(text).slice(0, max);
const oneOf = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;

/** Trims, rounds and drops what the configuration makes irrelevant; never throws on malformed input. */
export function normalizeProduct(raw: unknown): ProductInput {
  const input = asObject(raw);
  const branch = oneOf(BRANCHES, input.branch, "pet");
  const maxLines = number(input.maxLines);
  const lineCount = Number.isInteger(maxLines) ? Math.min(Math.max(maxLines, 1), MAX_ENGRAVE_LINES) : MAX_ENGRAVE_LINES;
  const backEngravingAvailable = input.backEngravingAvailable === true;
  const trimTrailing = (values: string[]) => {
    const copy = [...values];
    while (copy.length > 0 && copy[copy.length - 1] === "") copy.pop();
    return copy;
  };
  return {
    slug: text(input.slug).toLowerCase(),
    branch,
    name: text(input.name),
    subtitle: text(input.subtitle),
    description: text(input.description),
    priceBani: Math.round(number(input.priceBani)),
    highlights: lines(input.highlights, 50).filter(Boolean),
    isFeatured: input.isFeatured === true,
    isActive: input.isActive !== false,
    sortOrder: number(input.sortOrder),
    visual: oneOf(VISUAL_KEYS, input.visual, "hex-tag"),
    sampleEngraving: trimTrailing(lines(input.sampleEngraving, lineCount)),
    widthMm: round2(number(input.widthMm)),
    heightMm: round2(number(input.heightMm)),
    depthMm: round2(number(input.depthMm)),
    weightGrams: round2(number(input.weightGrams)),
    blankSku: text(input.blankSku).toUpperCase(),
    material: oneOf(MATERIALS, input.material, "BRASS"),
    engraveWidthMm: round2(number(input.engraveWidthMm)),
    engraveHeightMm: round2(number(input.engraveHeightMm)),
    engraveDepthMm: round2(number(input.engraveDepthMm)),
    recommendedMachine: oneOf(
      Object.keys(MACHINES) as Array<keyof typeof MACHINES>,
      input.recommendedMachine,
      machineForBranch(branch),
    ),
    engravingMethod: oneOf(
      Object.keys(ENGRAVING_METHODS) as Array<keyof typeof ENGRAVING_METHODS>,
      input.engravingMethod,
      "ROTARY_MILLING",
    ),
    toolRecommendation: text(input.toolRecommendation),
    maxCharsPerLine: number(input.maxCharsPerLine),
    maxLines,
    frontLineHints: trimTrailing(lines(input.frontLineHints, lineCount)),
    backLineHints: backEngravingAvailable ? trimTrailing(lines(input.backLineHints, lineCount)) : [],
    backEngravingAvailable,
    backEngravingPriceBani: backEngravingAvailable ? Math.round(number(input.backEngravingPriceBani)) : 0,
    symbolSets: SYMBOL_SETS.filter((set) => Array.isArray(input.symbolSets) && input.symbolSets.includes(set)),
    stockQuantity: number(input.stockQuantity),
    lowStockThreshold: number(input.lowStockThreshold),
    leadTimeDays: number(input.leadTimeDays),
    variants: (Array.isArray(input.variants) ? input.variants : []).slice(0, 50).map((value) => {
      const variant = asObject(value);
      return {
        name: text(variant.name),
        material: oneOf(MATERIALS, variant.material, "BRASS"),
        swatch: text(variant.swatch).toLowerCase(),
        priceDeltaBani: Math.round(number(variant.priceDeltaBani)),
        isDefault: variant.isDefault === true,
      };
    }),
    volumeTiers: (Array.isArray(input.volumeTiers) ? input.volumeTiers : [])
      .slice(0, 50)
      .map((value) => {
        const tier = asObject(value);
        return { minQuantity: number(tier.minQuantity), discountPercent: number(tier.discountPercent) };
      })
      .sort((a, b) => a.minQuantity - b.minQuantity),
  };
}

// ── Validation ──────────────────────────────────────────────────────────────────────────────────

interface Range {
  min: number;
  max: number;
  integer?: boolean;
  unit?: string;
}

function checkNumber(value: number, { min, max, integer = false, unit = "" }: Range): string | undefined {
  if (!Number.isFinite(value)) return "Completează o valoare.";
  if (integer && !Number.isInteger(value)) return "Doar numere întregi.";
  if (value < min || value > max) return `Între ${formatNumber(min)} și ${formatNumber(max)}${unit}.`;
  return undefined;
}

function checkBani(value: number, min: number, max: number): string | undefined {
  if (!Number.isFinite(value)) return "Completează prețul.";
  if (value < min || value > max) return `Între ${formatRon(min)} și ${formatRon(max)}.`;
  return undefined;
}

function checkText(value: string, min: number, max: number): string | undefined {
  if (value.length < min) return min <= 1 ? "Câmp obligatoriu." : `Cel puțin ${min} caractere.`;
  if (value.length > max) return `Cel mult ${max} caractere.`;
  return undefined;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const HEX = /^#[0-9a-f]{6}$/;

/** Expects normalizeProduct() output. Empty result = valid. */
export function validateProduct(product: ProductInput): ProductErrors {
  const errors: ProductErrors = {};
  const set = (key: string, message: string | undefined) => {
    if (message && !errors[key]) errors[key] = message;
  };
  const chars = (value: string) => [...value].length;

  // Identity
  set("name", checkText(product.name, 3, 120));
  set("subtitle", checkText(product.subtitle, 3, 160));
  set("description", checkText(product.description, 20, 4000));
  set("slug", checkText(product.slug, 3, 80) ?? (SLUG.test(product.slug) ? undefined : "Doar litere mici, cifre și cratime."));
  if (product.highlights.length > MAX_HIGHLIGHTS) set("highlights", `Cel mult ${MAX_HIGHLIGHTS} puncte forte.`);
  if (product.highlights.some((line) => line.length > 160))
    set("highlights", "Fiecare punct forte are cel mult 160 de caractere.");
  set("sortOrder", checkNumber(product.sortOrder, { min: 0, max: 999, integer: true }));

  // Price & stock
  set("priceBani", checkBani(product.priceBani, 100, 10_000_000));
  set("stockQuantity", checkNumber(product.stockQuantity, { min: 0, max: 100_000, integer: true }));
  set("lowStockThreshold", checkNumber(product.lowStockThreshold, { min: 0, max: 10_000, integer: true }));
  set("leadTimeDays", checkNumber(product.leadTimeDays, { min: 1, max: 60, integer: true, unit: " zile" }));

  // Physical blank
  const mm = { min: 1, max: 2000, unit: " mm" };
  set("widthMm", checkNumber(product.widthMm, mm));
  set("heightMm", checkNumber(product.heightMm, mm));
  set("depthMm", checkNumber(product.depthMm, { min: 0.1, max: 1000, unit: " mm" }));
  set("weightGrams", checkNumber(product.weightGrams, { min: 0.1, max: 50_000, unit: " g" }));

  // M20 technical parameters
  set(
    "blankSku",
    checkText(product.blankSku, 3, 40) ??
      (SKU.test(product.blankSku) ? undefined : "Litere, cifre și cratime (ex. PET-HEX-BR-30)."),
  );
  set("engraveWidthMm", checkNumber(product.engraveWidthMm, { min: 1, max: 600, unit: " mm" }));
  set("engraveHeightMm", checkNumber(product.engraveHeightMm, { min: 1, max: 600, unit: " mm" }));
  if (!errors.engraveWidthMm && !errors.widthMm && product.engraveWidthMm > product.widthMm) {
    set("engraveWidthMm", "Zona de gravură e mai lată decât piesa.");
  }
  if (!errors.engraveHeightMm && !errors.heightMm && product.engraveHeightMm > product.heightMm) {
    set("engraveHeightMm", "Zona de gravură e mai înaltă decât piesa.");
  }
  set("engraveDepthMm", checkNumber(product.engraveDepthMm, { min: 0.01, max: 2, unit: " mm" }));
  if (!errors.engraveDepthMm && !errors.depthMm && product.engraveDepthMm >= product.depthMm) {
    set("engraveDepthMm", "Adâncimea gravurii trebuie să fie mai mică decât grosimea piesei.");
  }
  set("toolRecommendation", checkText(product.toolRecommendation, 5, 300));

  // Personalisation
  set("maxLines", checkNumber(product.maxLines, { min: 1, max: MAX_ENGRAVE_LINES, integer: true }));
  set("maxCharsPerLine", checkNumber(product.maxCharsPerLine, { min: 1, max: 60, integer: true }));
  if (product.frontLineHints.some((hint) => hint.length > 60)) set("frontLineHints", "Indicațiile au cel mult 60 de caractere.");
  if (product.backLineHints.some((hint) => hint.length > 60)) set("backLineHints", "Indicațiile au cel mult 60 de caractere.");
  if (Number.isFinite(product.maxCharsPerLine) && product.sampleEngraving.some((line) => chars(line) > product.maxCharsPerLine)) {
    set("sampleEngraving", `Textul de exemplu depășește ${product.maxCharsPerLine} caractere pe rând.`);
  }
  if (product.backEngravingAvailable) set("backEngravingPriceBani", checkBani(product.backEngravingPriceBani, 0, 100_000));

  // Finishes
  if (product.variants.length === 0) set("variants", "Adaugă cel puțin un finisaj.");
  if (product.variants.length > MAX_VARIANTS) set("variants", `Cel mult ${MAX_VARIANTS} finisaje.`);
  const defaults = product.variants.filter((variant) => variant.isDefault).length;
  if (product.variants.length > 0 && defaults !== 1) set("variants", "Alege exact un finisaj implicit.");
  const variantNames = new Set<string>();
  product.variants.forEach((variant, index) => {
    const key = (field: string) => `variants.${index}.${field}`;
    set(key("name"), checkText(variant.name, 2, 60));
    const folded = variant.name.toLocaleLowerCase("ro-RO");
    if (variantNames.has(folded)) set(key("name"), "Două finisaje au același nume.");
    variantNames.add(folded);
    if (!HEX.test(variant.swatch)) set(key("swatch"), "Culoare hex, ex. #b5945b.");
    if (!Number.isInteger(variant.priceDeltaBani))
      set(key("priceDeltaBani"), "Completează diferența de preț (0 dacă nu există).");
    else if (variant.priceDeltaBani > 1_000_000) set(key("priceDeltaBani"), `Cel mult +${formatRon(1_000_000)}.`);
    else if (Number.isFinite(product.priceBani) && product.priceBani + variant.priceDeltaBani < 100) {
      set(key("priceDeltaBani"), "Prețul piesei cu acest finisaj ar coborî sub 1 RON.");
    }
  });

  // Volume tiers
  if (product.volumeTiers.length > MAX_TIERS) set("volumeTiers", `Cel mult ${MAX_TIERS} tranșe.`);
  product.volumeTiers.forEach((tier, index) => {
    const key = (field: string) => `volumeTiers.${index}.${field}`;
    set(key("minQuantity"), checkNumber(tier.minQuantity, { min: 2, max: 100_000, integer: true, unit: " buc." }));
    set(key("discountPercent"), checkNumber(tier.discountPercent, { min: 1, max: 60, integer: true, unit: "%" }));
    const previous = product.volumeTiers[index - 1];
    if (previous && tier.minQuantity === previous.minQuantity) set(key("minQuantity"), "Două tranșe încep la aceeași cantitate.");
    else if (previous && tier.discountPercent <= previous.discountPercent) {
      set(key("discountPercent"), "Reducerea trebuie să crească odată cu cantitatea.");
    }
  });

  return errors;
}
