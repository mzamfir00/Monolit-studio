import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Children, Fragment, createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { ImageResponse } from "next/og";
import { MaterialDefs } from "@/components/product/MaterialDefs";
import { ProductVisual } from "@/components/product/ProductVisual";
import type { Atelier, CatalogProduct } from "@/lib/types";

// Open Graph share images (1200 × 630), drawn with next/og (Satori). Satori cannot read CSS variables, so each
// atelier's palette is repeated here from globals.css; keep the two in step when a palette changes.

export const OG_SIZE = { width: 1200, height: 630 };

type FontName = "Cormorant" | "Fraunces" | "Bodoni" | "SpaceGrotesk" | "ArchivoExpanded" | "Jakarta";

interface Look {
  bg: string;
  panel: string;
  ink: string;
  muted: string;
  accent: string;
  /** Second accent: prices, rules, small caps. */
  metal: string;
  display: FontName;
  uppercase: boolean;
}

const LOOK: Record<Atelier, Look> = {
  umbrella: {
    bg: "#f7f5f0",
    panel: "#efece6",
    ink: "#181818",
    muted: "#5d5a55",
    accent: "#1e352f",
    metal: "#7e6332",
    display: "Cormorant",
    uppercase: false,
  },
  pet: {
    bg: "#f3ede2",
    panel: "#faf6f0",
    ink: "#22201c",
    muted: "#625a50",
    accent: "#1b3b2b",
    metal: "#9e4b31",
    display: "Fraunces",
    uppercase: false,
  },
  jewelry: {
    bg: "#faf9f6",
    panel: "#ffffff",
    ink: "#0a0a0a",
    muted: "#78716a",
    accent: "#c5a059",
    metal: "#8a6a2e",
    display: "Bodoni",
    uppercase: false,
  },
  vault: {
    bg: "#0b0c0e",
    panel: "#131519",
    ink: "#f3f4f6",
    muted: "#8b8b94",
    accent: "#d97736",
    metal: "#e8925a",
    display: "SpaceGrotesk",
    uppercase: true,
  },
  corporate: {
    bg: "#e8e6e1",
    panel: "#f7f6f2",
    ink: "#121212",
    muted: "#55534f",
    accent: "#121212",
    metal: "#8c5a32",
    display: "ArchivoExpanded",
    uppercase: true,
  },
};

// Literal paths so Vercel's file tracing ships the fonts with the function.
const FONT_FILES: Record<FontName, { file: string; weight: 400 | 500 | 700 }> = {
  Cormorant: { file: path.join(process.cwd(), "assets/og-fonts/cormorant-garamond-500.ttf"), weight: 500 },
  Fraunces: { file: path.join(process.cwd(), "assets/og-fonts/fraunces-400.ttf"), weight: 400 },
  Bodoni: { file: path.join(process.cwd(), "assets/og-fonts/bodoni-moda-400.ttf"), weight: 400 },
  SpaceGrotesk: { file: path.join(process.cwd(), "assets/og-fonts/space-grotesk-700.ttf"), weight: 700 },
  ArchivoExpanded: { file: path.join(process.cwd(), "assets/og-fonts/archivo-expanded-700.ttf"), weight: 700 },
  Jakarta: { file: path.join(process.cwd(), "assets/og-fonts/plus-jakarta-sans-500.ttf"), weight: 500 },
};

let fontCache: Promise<Array<{ name: string; data: Buffer; weight: 400 | 500 | 700; style: "normal" }>> | null = null;

function loadFonts() {
  fontCache ??= Promise.all(
    (Object.entries(FONT_FILES) as Array<[FontName, { file: string; weight: 400 | 500 | 700 }]>).map(async ([name, font]) => ({
      name,
      data: await readFile(font.file),
      weight: font.weight,
      style: "normal" as const,
    })),
  );
  return fontCache;
}

/**
 * Turns a component tree into plain SVG elements Satori can draw: function components are called (ProductVisual
 * and MaterialDefs use no hooks), <text> is dropped (Satori cannot draw SVG text) and undefined props removed.
 */
function plainSvg(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return node.map(plainSvg);
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown> & { children?: ReactNode }>;
  const type: unknown = element.type;
  if (typeof type === "function") return plainSvg((type as (props: unknown) => ReactNode)(element.props));
  if (type === Fragment) return Children.toArray(plainSvg(element.props.children));
  if (type === "text") return null;
  const { children, ...rest } = element.props;
  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(rest)) {
    if (value === undefined || value === null || name === "className" || name === "role" || name.startsWith("aria-")) continue;
    props[name] =
      name === "style" && typeof value === "object"
        ? Object.fromEntries(Object.entries(value as object).filter(([, entry]) => entry !== undefined))
        : value;
  }
  return createElement(element.type, { ...props, key: element.key ?? undefined }, ...Children.toArray(plainSvg(children)));
}

/** The blank's to-scale drawing, as used on the product page (engraved text omitted). */
function Drawing({ product, size }: { product: CatalogProduct; size: number }) {
  const defs = (MaterialDefs() as ReactElement<{ children: ReactNode }>).props.children;
  return plainSvg(
    <svg width={size} height={size} viewBox="0 0 400 400">
      {defs}
      <ProductVisual product={product} />
    </svg>,
  );
}

export interface OgContent {
  atelier: Atelier;
  /** Small line above the title (atelier name, category). */
  kicker: string;
  title: string;
  /** One line under the title (material and size, or the tagline). */
  detail: string;
  /** Formatted price, product images only. */
  price?: string;
  product?: CatalogProduct;
}

const caps = (look: Look, text: string) => (look.uppercase ? text.toUpperCase() : text);

function Text({ look, kicker, title, detail, price, align = "left" }: OgContent & { look: Look; align?: "left" | "center" }) {
  const longTitle = title.length > 34;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: align === "center" ? "center" : "flex-start" }}>
      <div
        style={{
          display: "flex",
          fontFamily: "Jakarta",
          fontSize: 20,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: look.metal,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: look.display,
          fontSize: look.uppercase ? (longTitle ? 50 : 62) : longTitle ? 64 : 80,
          lineHeight: 1.04,
          letterSpacing: look.uppercase ? -1 : -1.5,
          color: look.ink,
          textAlign: align,
        }}
      >
        {caps(look, title)}
      </div>
      <div style={{ display: "flex", fontFamily: "Jakarta", fontSize: 24, color: look.muted, textAlign: align, maxWidth: 560 }}>
        {detail}
      </div>
      {price && (
        <div style={{ display: "flex", fontFamily: look.display, fontSize: 40, color: look.metal, marginTop: 6 }}>{price}</div>
      )}
    </div>
  );
}

function Mark({ look, text }: { look: Look; text: string }) {
  return (
    <div style={{ display: "flex", fontFamily: "Jakarta", fontSize: 16, letterSpacing: 4, color: look.muted }}>
      {text.toUpperCase()}
    </div>
  );
}

function Layout(content: OgContent) {
  const look = LOOK[content.atelier];
  const drawing = content.product ? <Drawing product={content.product} size={430} /> : null;
  const base = {
    display: "flex",
    width: "100%",
    height: "100%",
    backgroundColor: look.bg,
    color: look.ink,
    fontFamily: "Jakarta",
  } as const;

  switch (content.atelier) {
    case "pet":
      // Warm split: text left, the piece in a stitched cream arch on the right.
      return (
        <div style={{ ...base, padding: "56px 64px", alignItems: "center", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", flex: 1 }}>
            <Text {...content} look={look} />
            <Mark look={look} text="maison gravure · gravură mecanică" />
          </div>
          {drawing && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                width: 460,
                height: 520,
                padding: 14,
                backgroundColor: look.panel,
                borderRadius: "230px 230px 32px 32px",
                border: `2px dashed ${look.accent}40`,
              }}
            >
              {drawing}
            </div>
          )}
        </div>
      );
    case "jewelry":
      // Gallery quiet: gold hairline frame, the piece in a sharp white frame, centred caption.
      return (
        <div style={{ ...base, padding: 28 }}>
          <div
            style={{
              display: "flex",
              flex: 1,
              border: `1px solid ${look.accent}`,
              alignItems: "center",
              justifyContent: "center",
              gap: 56,
              padding: "0 56px",
            }}
          >
            {drawing && (
              <div
                style={{
                  display: "flex",
                  width: 400,
                  height: 500,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: look.panel,
                  border: "1px solid #e6e2dd",
                }}
              >
                {drawing}
              </div>
            )}
            <div style={{ display: "flex", flex: 1 }}>
              <Text {...content} look={look} align={drawing ? "left" : "center"} />
            </div>
          </div>
        </div>
      );
    case "vault":
      // Blueprint HUD: carbon grid, copper corner brackets around the drawing.
      return (
        <div
          style={{
            ...base,
            padding: "56px 64px",
            alignItems: "center",
            gap: 40,
            backgroundImage:
              "linear-gradient(to right, #1f2229 1px, transparent 1px), linear-gradient(to bottom, #1f2229 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", flex: 1 }}>
            <Text {...content} look={look} />
            <Mark look={look} text="sys: gravograph m20 // ±0,01 mm" />
          </div>
          {drawing && (
            <div
              style={{
                display: "flex",
                position: "relative",
                width: 470,
                height: 500,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: look.panel,
                border: "1px solid #262930",
              }}
            >
              {[
                { top: -1, left: -1, borderTop: `2px solid ${look.accent}`, borderLeft: `2px solid ${look.accent}` },
                { top: -1, right: -1, borderTop: `2px solid ${look.accent}`, borderRight: `2px solid ${look.accent}` },
                { bottom: -1, left: -1, borderBottom: `2px solid ${look.accent}`, borderLeft: `2px solid ${look.accent}` },
                { bottom: -1, right: -1, borderBottom: `2px solid ${look.accent}`, borderRight: `2px solid ${look.accent}` },
              ].map((corner, index) => (
                <div key={index} style={{ position: "absolute", width: 22, height: 22, ...corner }} />
              ))}
              {drawing}
            </div>
          )}
        </div>
      );
    case "corporate":
      // Specification sheet: black 1px grid, index cells, drawing cell.
      return (
        <div style={{ ...base, padding: 40 }}>
          <div style={{ display: "flex", flex: 1, border: `1px solid ${look.ink}` }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                borderRight: drawing ? `1px solid ${look.ink}` : "none",
              }}
            >
              <div style={{ display: "flex", borderBottom: `1px solid ${look.ink}`, fontSize: 18, letterSpacing: 3 }}>
                {["SPEC. B2B", "HORECA & CABANE"].map((label, index) => (
                  <div
                    key={label}
                    style={{ display: "flex", padding: "14px 20px", borderRight: index === 0 ? `1px solid ${look.ink}` : "none" }}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flex: 1, padding: "36px 32px", alignItems: "center" }}>
                <Text {...content} look={look} />
              </div>
            </div>
            {drawing && (
              <div
                style={{
                  display: "flex",
                  width: 470,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: look.panel,
                  backgroundImage:
                    "linear-gradient(to right, #1212120f 1px, transparent 1px), linear-gradient(to bottom, #1212120f 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              >
                {drawing}
              </div>
            )}
          </div>
        </div>
      );
    default:
      // Maison Gravure hub: ivory, brass ring around the piece.
      return (
        <div style={{ ...base, padding: "56px 64px", alignItems: "center", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", flex: 1 }}>
            <Text {...content} look={look} />
            <Mark look={look} text="3 × gravograph m20 · diamant și frezare" />
          </div>
          {drawing && (
            <div
              style={{
                display: "flex",
                width: 480,
                height: 480,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: `2px solid ${look.metal}`,
                backgroundColor: look.panel,
              }}
            >
              {drawing}
            </div>
          )}
        </div>
      );
  }
}

export async function renderOgImage(content: OgContent) {
  return new ImageResponse(<Layout {...content} />, { ...OG_SIZE, fonts: await loadFonts() });
}
