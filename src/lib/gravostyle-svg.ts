// 1-click Gravostyle export. The SVG canvas is the blank's engraving area in millimetres —
// width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}" — so one user unit is one millimetre and the file drops
// into Gravostyle at its physical size, with no rescaling.
//
// Two layers:
//   GHID     cyan hairlines, NOT to be engraved: the blank's outline at true scale (it may extend past the
//            canvas, around the engraving area) and the engraving-zone frame. Delete or disable before running.
//   GRAVURA  black: the vector symbol and the customer's text lines, centred with the same layout as the
//            storefront preview (src/lib/engraving.ts).

import { BLANK_GEOMETRY as G } from "./blank-geometry";
import type { BlankSpec } from "./blank-spec";
import { fitTextSize, splitEngraveArea, usedLines, type EngravingFont, type Rect } from "./engraving";
import type { SymbolDef } from "./symbols";

export type ExportSide = "front" | "back";

export interface GravostyleJob {
  spec: BlankSpec;
  side: ExportSide;
  lines: string[];
  font: EngravingFont;
  /** Front only. */
  symbol?: SymbolDef | null;
  initials?: string;
  /** Front only: the customer's sketch is vectorised by hand, so the export reserves and marks its slot. */
  sketchName?: string | null;
  orderNumber: string;
  productName: string;
}

export const GUIDE_COLOR = "#00AEEF";

/** Millimetre number, dot decimal, at most three decimals. */
const mm = (value: number) => String(Math.round(value * 1000) / 1000);

const xml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const circle = (cx: number, cy: number, r: number) =>
  `M${mm(cx - r)} ${mm(cy)}a${mm(r)} ${mm(r)} 0 1 0 ${mm(2 * r)} 0a${mm(r)} ${mm(r)} 0 1 0 ${mm(-2 * r)} 0Z`;

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  return [
    `M${mm(x + k)} ${mm(y)}H${mm(x + w - k)}`,
    k ? `A${mm(k)} ${mm(k)} 0 0 1 ${mm(x + w)} ${mm(y + k)}` : "",
    `V${mm(y + h - k)}`,
    k ? `A${mm(k)} ${mm(k)} 0 0 1 ${mm(x + w - k)} ${mm(y + h)}` : "",
    `H${mm(x + k)}`,
    k ? `A${mm(k)} ${mm(k)} 0 0 1 ${mm(x)} ${mm(y + h - k)}` : "",
    `V${mm(y + k)}`,
    k ? `A${mm(k)} ${mm(k)} 0 0 1 ${mm(x + k)} ${mm(y)}` : "",
    "Z",
  ].join("");
}

/**
 * Outline of the blank in engraving-area coordinates (origin = top-left of the engraving area, mm).
 * Each family places its engraving area the same way the storefront drawing does.
 */
export function blankGuidePath(spec: BlankSpec): string {
  const W = spec.engraveWidthMm;
  const H = spec.engraveHeightMm;
  const { widthMm: w, heightMm: h } = spec;
  // Top-left of a w × h blank whose point (px, py) sits on the centre of the engraving area.
  const origin = (px: number, py: number) => [W / 2 - px, H / 2 - py] as const;

  switch (spec.visual) {
    case "hex-tag": {
      const [x, y] = origin(w / 2, h / 2 + G.hexTag.engraveOffsetYMm);
      const r = h / 2;
      const [cx, cy] = [x + w / 2, y + h / 2];
      const corners = [-90, -30, 30, 90, 150, 210].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return `${mm(cx + r * Math.cos(a))} ${mm(cy + r * Math.sin(a))}`;
      });
      return `M${corners.join("L")}Z${circle(cx, y + G.hexTag.holeFromTopMm, G.hexTag.holeDiameterMm / 2)}`;
    }
    case "coin-pendant":
      return circle(W / 2, H / 2, w / 2);
    case "cufflinks": {
      const [x, y] = origin(w / 2, h / 2);
      return roundedRect(x, y, w, h, G.cufflinks.cornerRadiusMm);
    }
    case "spoon": {
      const { bowlLengthMm: bowl, paddleHalfWidthMm: paddle, engraveEndInsetMm: inset } = G.spoon;
      const [x, y] = origin(w - inset - W / 2, h / 2);
      const cy = y + h / 2;
      const neck = x + bowl * 0.95;
      const end = x + w;
      const handle =
        `M${mm(neck)} ${mm(cy - 1.8)}C${mm(x + w * 0.55)} ${mm(cy - 2.9)} ${mm(x + w * 0.7)} ${mm(cy - paddle)} ${mm(end - paddle)} ${mm(cy - paddle)}` +
        `Q${mm(end)} ${mm(cy - paddle)} ${mm(end)} ${mm(cy)}Q${mm(end)} ${mm(cy + paddle)} ${mm(end - paddle)} ${mm(cy + paddle)}` +
        `C${mm(x + w * 0.7)} ${mm(cy + paddle)} ${mm(x + w * 0.55)} ${mm(cy + 2.9)} ${mm(neck)} ${mm(cy + 1.8)}Z`;
      const rx = bowl / 2;
      const bowlPath = `M${mm(x)} ${mm(cy)}a${mm(rx)} ${mm(h / 2)} 0 1 0 ${mm(2 * rx)} 0a${mm(rx)} ${mm(h / 2)} 0 1 0 ${mm(-2 * rx)} 0Z`;
      return bowlPath + handle;
    }
    case "lighter": {
      const lid = G.lighter.lidHeightMm;
      const [x, y] = origin(w / 2, lid + (h - lid) / 2);
      return `${roundedRect(x, y, w, h, G.lighter.cornerRadiusMm)}M${mm(x)} ${mm(y + lid)}H${mm(x + w)}`;
    }
    case "cardholder": {
      const { bandFromLeftMm: from, bandWidthMm: band, cornerRadiusMm: r } = G.cardholder;
      const [x, y] = origin((from + band + w) / 2, h / 2);
      return `${roundedRect(x, y, w, h, r)}${roundedRect(x + from, y - 1.5, band, h + 3, 0.8)}`;
    }
    case "flask": {
      const { capWidthMm: capW, capHeightMm: capH, shoulderDropMm: drop, shoulderMm } = G.flask;
      const shoulder = capH + drop;
      const panelTop = shoulder + shoulderMm;
      const [x, y] = origin(w / 2, (panelTop + h) / 2 - drop);
      const R = x + w;
      const B = y + h;
      const S = y + shoulder;
      const P = y + panelTop;
      const k = 10.7;
      return (
        roundedRect(x + w / 2 - capW / 2, y, capW, capH, 2.5) +
        `M${mm(x + w / 2 - capW * 0.4)} ${mm(S)}C${mm(x + 16.5)} ${mm(S)} ${mm(x)} ${mm(S + 7.4)} ${mm(x)} ${mm(P)}` +
        `V${mm(B - k)}Q${mm(x)} ${mm(B)} ${mm(x + k)} ${mm(B)}H${mm(R - k)}Q${mm(R)} ${mm(B)} ${mm(R)} ${mm(B - k)}` +
        `V${mm(P)}C${mm(R)} ${mm(S + 7.4)} ${mm(R - 16.5)} ${mm(S)} ${mm(x + w / 2 + capW * 0.4)} ${mm(S)}Z`
      );
    }
    case "keyfob": {
      const { holeFromLeftMm, holeDiameterMm, engraveFromLeftMm } = G.keyfob;
      const [x, y] = origin(engraveFromLeftMm + W / 2, h / 2);
      return roundedRect(x, y, w, h, h / 2) + circle(x + holeFromLeftMm, y + h / 2, holeDiameterMm / 2);
    }
    case "plaque":
    case "nameplate":
    case "bowl-stand":
    case "collar": {
      const plate = G.plates[spec.visual];
      const [x, y] = origin(plate.widthMm / 2, plate.heightMm / 2);
      return roundedRect(x, y, plate.widthMm, plate.heightMm, spec.visual === "collar" ? 1.5 : 0);
    }
  }
}

function textLines(rect: Rect, lines: string[], font: EngravingFont): string {
  const size = fitTextSize(rect, lines);
  const lineHeight = size * 1.3;
  const top = rect.y + rect.h / 2 - (lineHeight * (lines.length - 1)) / 2;
  return lines
    .map((line, index) => {
      const content = font.uppercase ? line.toLocaleUpperCase("ro-RO") : line;
      // Baseline placed so the cap height is centred on the line (same 0.35em shift as the preview).
      const baseline = top + index * lineHeight + size * 0.35;
      return `    <text x="${mm(rect.x + rect.w / 2)}" y="${mm(baseline)}" font-family="${xml(font.family)}" font-size="${mm(size)}" text-anchor="middle" xml:space="preserve">${xml(content)}</text>`;
    })
    .join("\n");
}

function symbolGroup(rect: Rect, symbol: SymbolDef, initials: string, font: EngravingFont): string {
  const scale = rect.w / 24;
  const paths = symbol.paths.map(
    (path) =>
      `      <path d="${path.d}"${path.transform ? ` transform="${path.transform}"` : ""} ${
        path.fill
          ? 'fill="#000000" stroke="none"'
          : 'fill="none" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"'
      }/>`,
  );
  if (symbol.monogramSlot && initials) {
    const slot = symbol.monogramSlot;
    const size = slot.size * (initials.length > 2 ? 0.8 : 1);
    paths.push(
      `      <text x="${slot.x}" y="${mm(slot.y + size * 0.35)}" font-family="${xml(font.family)}" font-size="${mm(size)}" text-anchor="middle">${xml(initials)}</text>`,
    );
  }
  return `    <g id="simbol-${symbol.key}" transform="translate(${mm(rect.x)} ${mm(rect.y)}) scale(${mm(scale)})">\n${paths.join("\n")}\n    </g>`;
}

export function buildGravostyleSvg(job: GravostyleJob): string {
  const { spec, side, font } = job;
  const W = spec.engraveWidthMm;
  const H = spec.engraveHeightMm;
  const lines = usedLines(job.lines);
  const symbol = side === "front" ? (job.symbol ?? null) : null;
  const sketch = side === "front" ? (job.sketchName ?? null) : null;
  const { graphic, text } = splitEngraveArea({ x: 0, y: 0, w: W, h: H }, Boolean(symbol || sketch), lines.length > 0);
  const sideLabel = side === "front" ? "Față" : "Verso";

  const guides = [
    `    <path id="contur-semifabricat" d="${blankGuidePath(spec)}"/>`,
    `    <rect id="zona-gravura" x="0" y="0" width="${mm(W)}" height="${mm(H)}" stroke-dasharray="0.6 0.4"/>`,
  ];
  if (graphic && sketch) {
    const label = Math.min(2.2, graphic.h / 6);
    guides.push(
      `    <rect id="loc-schita" x="${mm(graphic.x)}" y="${mm(graphic.y)}" width="${mm(graphic.w)}" height="${mm(graphic.h)}" stroke-dasharray="0.4 0.3"/>`,
      `    <text x="${mm(graphic.x + graphic.w / 2)}" y="${mm(graphic.y + graphic.h / 2)}" fill="${GUIDE_COLOR}" stroke="none" font-family="sans-serif" font-size="${mm(label)}" text-anchor="middle">SCHIȚĂ CLIENT</text>`,
    );
  }

  const engraving: string[] = [];
  if (graphic && symbol) engraving.push(symbolGroup(graphic, symbol, job.initials ?? "", font));
  if (text) engraving.push(textLines(text, lines, font));

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${mm(W)}mm" height="${mm(H)}mm" viewBox="0 0 ${mm(W)} ${mm(H)}" overflow="visible">`,
    `  <title>${xml(`${job.orderNumber} · ${job.productName} · ${sideLabel}`)}</title>`,
    `  <desc>${xml(
      `Zonă de gravură ${mm(W)} × ${mm(H)} mm · semifabricat ${spec.blankSku} (${mm(spec.widthMm)} × ${mm(spec.heightMm)} mm) · font ${font.family} · ` +
        (sketch ? `schița clientului (${sketch}) se vectorizează manual în zona marcată · ` : "") +
        `stratul GHID (cyan) nu se gravează.`,
    )}</desc>`,
    `  <g id="GHID" fill="none" stroke="${GUIDE_COLOR}" stroke-width="0.1">`,
    ...guides,
    `  </g>`,
    `  <g id="GRAVURA" fill="#000000">`,
    ...engraving,
    `  </g>`,
    `</svg>`,
    "",
  ].join("\n");
}

export function gravostyleFilename(job: Pick<GravostyleJob, "orderNumber" | "spec" | "side">): string {
  const side = job.side === "front" ? "fata" : "verso";
  return `${job.orderNumber}_${job.spec.blankSku}_${side}_${mm(job.spec.engraveWidthMm)}x${mm(job.spec.engraveHeightMm)}mm.svg`;
}
