// Small shared pieces of the four branch design systems (see src/app/branch-systems.css for the CSS half).

import { SymbolPaths } from "@/components/engraving/SymbolGlyph";
import { ATELIERS } from "@/lib/branches";
import { cn } from "@/lib/format";
import { getSymbol } from "@/lib/symbols";
import type { Branch, CatalogProduct, EngravingMethod, Material, ProductVisualKey } from "@/lib/types";

export const productHref = (product: CatalogProduct) => `${ATELIERS[product.branch].href}/produs/${product.slug}`;

export const pad2 = (value: number) => String(value).padStart(2, "0");

const ROMAN: Array<[number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(value: number): string {
  let rest = value;
  return ROMAN.reduce((out, [step, letters]) => {
    while (rest >= step) {
      out += letters;
      rest -= step;
    }
    return out;
  }, "");
}

/** Sets the `accent` words of a headline in their own style; the rest stays plain. */
export function AccentTitle({ text, accent, className }: { text: string; accent?: string; className: string }) {
  const at = accent ? text.indexOf(accent) : -1;
  if (!accent || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className={className}>{accent}</span>
      {text.slice(at + accent.length)}
    </>
  );
}

/** Technical "+" registration marks on the four corners of a positioned container. */
export function Crosshairs({ className }: { className?: string }) {
  const mark =
    "pointer-events-none absolute size-[9px] before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-current after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-current";
  return (
    <span aria-hidden="true" className={cn("transition-colors", className)}>
      <span className={cn(mark, "left-0 top-0 -translate-x-1/2 -translate-y-1/2")} />
      <span className={cn(mark, "right-0 top-0 translate-x-1/2 -translate-y-1/2")} />
      <span className={cn(mark, "bottom-0 left-0 -translate-x-1/2 translate-y-1/2")} />
      <span className={cn(mark, "bottom-0 right-0 translate-x-1/2 translate-y-1/2")} />
    </span>
  );
}

const PAW = getSymbol("paw");

/** Rotating circular seal with text set on its rim. `id` must be unique on the page. */
export function Stamp({ id, text, className }: { id: string; text: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className}>
      <defs>
        <path id={id} d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="58" className="fill-accent" />
      <circle cx="60" cy="60" r="53" fill="none" className="stroke-panel/40" strokeWidth="0.75" strokeDasharray="2 2.5" />
      <circle cx="60" cy="60" r="31" fill="none" className="stroke-panel/60" strokeWidth="0.75" />
      <g className="origin-center animate-spin-stamp">
        <text className="fill-panel" fontSize="9.2" fontWeight="600" letterSpacing="2.2" fontFamily="var(--b-font-sans)">
          <textPath href={`#${id}`}>{text}</textPath>
        </text>
      </g>
      {PAW && (
        <g transform="translate(48 48)" className="text-metal">
          <SymbolPaths symbol={PAW} />
        </g>
      )}
    </svg>
  );
}

/** Durability tag shown on Pedigree cards, by the material of the engraved surface. */
export const PET_MATERIAL_TAG: Record<Material, string> = {
  BRASS: "Alamă greu-uzură",
  STAINLESS_316L: "Inox anti-rugină",
  SILVER_925: "Argint masiv",
  TITANIUM: "Titan ultra-rezistent",
  LEATHER: "Piele vegetală",
  WOOD: "Lemn masiv",
  CERAMIC: "Ceramică glazurată",
};

/** Cut description used by Aurum's lookbook captions. */
export const JEWELRY_CUT: Record<EngravingMethod, string> = {
  DIAMOND_DRAG: "Tăietură diamant",
  ROTARY_MILLING: "Frezare fină",
};

/** Machine allocation read-out on Vault cards. */
export const VAULT_MACHINE_TAG: Record<EngravingMethod, string> = {
  DIAMOND_DRAG: "M20-DIAMANT",
  ROTARY_MILLING: "M20-ROTATIV",
};

/** B2B segment shown on Bespoke cards, by the kind of blank. */
export function corporateCategory(visual: ProductVisualKey): string {
  switch (visual) {
    case "keyfob":
      return "Cabane & hoteluri";
    case "plaque":
      return "Protocol & onoruri";
    case "nameplate":
      return "Birou executiv";
    default:
      return "Spec. B2B";
  }
}

/** Panel frame per atelier, for content cards that are not products (method cards, spec blocks…). */
export const PANEL: Record<Branch, string> = {
  pet: "stitch rounded-3xl border border-accent/15 bg-panel",
  jewelry: "border-[0.5px] border-line bg-panel",
  vault: "corner-brackets border border-line bg-surface",
  corporate: "border border-grid bg-panel",
};
