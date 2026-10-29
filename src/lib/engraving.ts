// Engraving configuration model shared by the configurator, the Universal Cart and (later) checkout,
// where the server must re-run validateEngraving before creating the Stripe session.

import type { Branch, CatalogProduct } from "./types";
import { getSymbol } from "./symbols";

export type FontKey = "classic-roman" | "monogram-script" | "modern-geometric" | "technical-block" | "minimal-sans";
export type EngravingSides = "FRONT" | "FRONT_AND_BACK";

export interface EngravingFont {
  key: FontKey;
  label: string;
  /** Family name as installed in Gravostyle, used by the SVG job export. */
  family: string;
  cssFamily: string;
  /** Cinzel only has capitals; the preview and inputs show text the way it will be cut. */
  uppercase?: boolean;
}

export const ENGRAVING_FONTS: EngravingFont[] = [
  { key: "classic-roman", label: "Classic Roman", family: "EB Garamond", cssFamily: "var(--font-eb-garamond), Garamond, serif" },
  { key: "monogram-script", label: "Monogram Script", family: "Great Vibes", cssFamily: "var(--font-great-vibes), cursive" },
  { key: "modern-geometric", label: "Modern Geometric", family: "Montserrat", cssFamily: "var(--font-montserrat), sans-serif" },
  {
    key: "technical-block",
    label: "Technical Block",
    family: "Cinzel",
    cssFamily: "var(--font-cinzel), serif",
    uppercase: true,
  },
  { key: "minimal-sans", label: "Minimal Sans", family: "Inter", cssFamily: "var(--font-inter), sans-serif" },
];

export const DEFAULT_FONT: Record<Branch, FontKey> = {
  pet: "classic-roman",
  jewelry: "classic-roman",
  vault: "modern-geometric",
  corporate: "technical-block",
};

export function getFont(key: FontKey): EngravingFont {
  return ENGRAVING_FONTS.find((font) => font.key === key) ?? ENGRAVING_FONTS[0];
}

export interface UploadedSketch {
  /** Storage id returned by POST /api/uploads. */
  id: string;
  name: string;
  size: number;
  type: string;
}

/** Exactly what the workshop engraves; mirrors the engraving columns of the Prisma OrderItem. */
export interface EngravingConfig {
  variantName: string;
  sides: EngravingSides;
  fontKey: FontKey;
  frontLines: string[];
  backLines: string[];
  symbolKey: string | null;
  sketch: UploadedSketch | null;
  giftPackaging: boolean;
}

// Letters (any script, incl. ă â î ș ț), digits and the punctuation the M20 fonts carry.
const DISALLOWED = /[^\p{L}\p{N} .,:;'’"„”«»\-–—&+/#@()!?·*°]/gu;

export const charCount = (value: string) => [...value].length;

/** Strips characters the engraving fonts cannot cut and truncates to the line limit. */
export function sanitizeLine(value: string, maxChars: number): string {
  return [...value.replace(DISALLOWED, "").replace(/\s{2,}/g, " ")].slice(0, maxChars).join("");
}

export const usedLines = (lines: string[]) => lines.filter((line) => line.trim().length > 0);

/** "Andrei Voicu" → "AV"; a short single word ("MDZ") is used as-is. */
export function initialsFrom(lines: string[]): string {
  const first = usedLines(lines)[0]?.trim() ?? "";
  const words = first.split(/\s+/).filter(Boolean);
  if (words.length === 1 && charCount(words[0]) <= 3) return words[0].toUpperCase();
  return words
    .slice(0, 3)
    .map((word) => [...word][0])
    .join("")
    .toUpperCase();
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Splits the engraving area between the graphic (symbol or sketch) and the text block: side by side on
 * long, flat areas, stacked otherwise. Shared by the preview and the letter-height estimate.
 */
export function splitEngraveArea(area: Rect, hasGraphic: boolean, hasText: boolean): { graphic: Rect | null; text: Rect | null } {
  if (!hasGraphic) return { graphic: null, text: hasText ? area : null };
  if (!hasText) {
    const side = Math.min(area.w, area.h);
    return { graphic: { x: area.x + (area.w - side) / 2, y: area.y + (area.h - side) / 2, w: side, h: side }, text: null };
  }
  if (area.w / area.h >= 1.6) {
    const side = area.h * 0.9;
    return {
      graphic: { x: area.x, y: area.y + (area.h - side) / 2, w: side, h: side },
      text: { x: area.x + area.h, y: area.y, w: area.w - area.h, h: area.h },
    };
  }
  const graphicH = area.h * 0.4;
  const side = Math.min(graphicH, area.w);
  return {
    graphic: { x: area.x + (area.w - side) / 2, y: area.y, w: side, h: side },
    text: { x: area.x, y: area.y + graphicH, w: area.w, h: area.h - graphicH },
  };
}

/** Font size (in the rect's unit) that fits every line inside the rect. */
export function fitTextSize(rect: Rect, lines: string[]): number {
  const longest = Math.max(...lines.map(charCount), 3);
  return Math.min(rect.h / (lines.length * 1.3), (rect.w * 0.9) / (longest * 0.7));
}

/** Approximate cap height in mm for the current text, from the same layout the preview draws. */
export function estimateLetterHeightMm(product: CatalogProduct, lines: string[], hasGraphic: boolean): number | null {
  const used = usedLines(lines);
  if (used.length === 0) return null;
  const { text } = splitEngraveArea({ x: 0, y: 0, w: product.engraveWidthMm, h: product.engraveHeightMm }, hasGraphic, true);
  return Math.round(fitTextSize(text!, used) * 0.7 * 10) / 10;
}

/** The engraving columns of a stored OrderItem, back in the EngravingConfig shape the UI renders. */
export function engravingFromOrderItem(item: {
  variantName: string;
  engravingSides: EngravingSides;
  fontKey: string;
  frontLines: string[];
  backLines: string[];
  symbolKey: string | null;
  customUploadUrl: string | null;
  sketchName: string | null;
  giftPackaging: boolean;
}): EngravingConfig {
  return {
    variantName: item.variantName,
    sides: item.engravingSides,
    fontKey: item.fontKey as FontKey,
    frontLines: item.frontLines,
    backLines: item.backLines,
    symbolKey: item.symbolKey,
    sketch: item.sketchName ? { id: item.customUploadUrl ?? "", name: item.sketchName, size: 0, type: "" } : null,
    giftPackaging: item.giftPackaging,
  };
}

/** One-line description of an engraving, for Stripe line items and e-mails. */
export function describeEngraving(config: EngravingConfig): string {
  const parts = [
    config.frontLines.length > 0 ? `Față: ${config.frontLines.join(" / ")}` : null,
    config.sides === "FRONT_AND_BACK" ? `Verso: ${config.backLines.join(" / ")}` : null,
    `Font: ${getFont(config.fontKey).label}`,
    config.symbolKey ? `Simbol: ${getSymbol(config.symbolKey)?.name ?? config.symbolKey}` : null,
    config.sketch ? `Schiță: ${config.sketch.name}` : null,
    config.giftPackaging ? "Cutie de catifea + certificat" : null,
  ];
  return parts.filter(Boolean).join(" · ");
}

export type EngravingErrorField = "variant" | "front" | "back" | "sketch" | "quantity";
export type EngravingErrors = Partial<Record<EngravingErrorField, string>>;

export function validateEngraving(product: CatalogProduct, config: EngravingConfig, quantity: number): EngravingErrors {
  const errors: EngravingErrors = {};
  if (!product.variants.some((variant) => variant.name === config.variantName)) {
    errors.variant = "Alege un material sau finisaj.";
  }
  const tooLong = (lines: string[]) => lines.some((line) => charCount(line) > product.maxCharsPerLine);
  if (config.frontLines.length > product.maxLines || tooLong(config.frontLines)) {
    errors.front = `Maximum ${product.maxLines} rânduri a câte ${product.maxCharsPerLine} caractere.`;
  } else if (usedLines(config.frontLines).length === 0 && !config.symbolKey && !config.sketch) {
    errors.front = "Scrie cel puțin un rând pe față, sau alege un simbol ori o schiță.";
  }
  if (config.sides === "FRONT_AND_BACK") {
    if (!product.backEngravingAvailable) errors.back = "Această piesă se gravează doar pe față.";
    else if (config.backLines.length > product.maxLines || tooLong(config.backLines)) {
      errors.back = `Maximum ${product.maxLines} rânduri a câte ${product.maxCharsPerLine} caractere.`;
    } else if (usedLines(config.backLines).length === 0) errors.back = "Completează textul pentru verso sau alege „Doar față”.";
  }
  if (config.symbolKey && !getSymbol(config.symbolKey)) errors.front = "Simbolul ales nu mai există.";
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stockQuantity) {
    errors.quantity =
      product.stockQuantity > 0
        ? `Poți comanda între 1 și ${product.stockQuantity} bucăți.`
        : "Semifabricatul nu mai este în stoc.";
  }
  return errors;
}
