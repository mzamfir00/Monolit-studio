// Proportional technical illustrations of each blank, drawn from the product's millimetre data.
// They stand in for photography and double as a preview of the engraving area.

import type { ReactNode } from "react";
import { SymbolPaths } from "@/components/engraving/SymbolGlyph";
import { BLANK_GEOMETRY as G } from "@/lib/blank-geometry";
import { fitTextSize, splitEngraveArea, usedLines } from "@/lib/engraving";
import { formatMm } from "@/lib/format";
import type { SymbolDef } from "@/lib/symbols";
import type { CatalogProduct, Material, ProductVariant, ProductVisualKey } from "@/lib/types";

const VB = 400;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Drawing {
  body: ReactNode;
  /** Envelope annotated with the product's outer dimensions; omitted where the view is not to scale. */
  outline?: { box: Box; wLabel: string; hLabel?: string };
  engrave: Box;
}

interface Metal {
  fill: string;
  edge: string;
  ink: string;
  glow: string;
}

const METALS: Partial<Record<Material, Metal>> = {
  BRASS: { fill: "url(#mg-brass)", edge: "#6e5024", ink: "#4f3814", glow: "rgba(255,240,200,0.55)" },
  SILVER_925: { fill: "url(#mg-silver)", edge: "#7d8085", ink: "#55585d", glow: "rgba(255,255,255,0.9)" },
  STAINLESS_316L: { fill: "url(#mg-steel)", edge: "#5f656c", ink: "#454a51", glow: "rgba(255,255,255,0.7)" },
  TITANIUM: { fill: "url(#mg-titanium)", edge: "#45484c", ink: "#f2f3f4", glow: "rgba(0,0,0,0.35)" },
};

const centered = (cx: number, cy: number, w: number, h: number): Box => ({ x: cx - w / 2, y: cy - h / 2, w, h });

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

/**
 * Colour to wash over the blank when a finish visibly changes the metal (gold plating, DLC, patina…).
 * Finishes of the same tone as the default — brushed vs polished brass — keep the base rendering.
 */
export function finishTint(product: CatalogProduct, variant: ProductVariant): string | undefined {
  const base = product.variants.find((candidate) => candidate.isDefault) ?? product.variants[0];
  if (variant === base || variant.material !== product.material || !/^#[0-9a-f]{6}$/i.test(variant.swatch)) return undefined;
  const [a, b] = [rgb(variant.swatch), rgb(base.swatch)];
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > 60 ? variant.swatch : undefined;
}

/** Patina, DLC, PVD, ruthenium: the coating darkens the metal and the engraving cuts through to bright metal. */
const isDarkFinish = (tint: string) => luminance(tint) < 0.5;

/** Dark finishes darken the metal and the cut shows bright; light ones (gold plating) only shift the hue. */
function TintFilter({ id, tint }: { id: string; tint: string }) {
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feFlood floodColor={tint} result="flood" />
      <feComposite in="flood" in2="SourceAlpha" operator="in" result="wash" />
      <feBlend in="wash" in2="SourceGraphic" mode={isDarkFinish(tint) ? "multiply" : "color"} />
    </filter>
  );
}

function hexagon(cx: number, cy: number, r: number) {
  return [-90, -30, 30, 90, 150, 210]
    .map((deg) => {
      const a = (deg * Math.PI) / 180;
      return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    })
    .join(" ");
}

function circlePath(cx: number, cy: number, r: number) {
  return `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
}

/** Customer engraving drawn into the engraving area (the configurator's live preview). */
export interface VisualEngraving {
  lines: string[];
  fontFamily: string;
  uppercase?: boolean;
  symbol?: SymbolDef | null;
  initials?: string;
  /** Object URL of an uploaded sketch, shown in the graphic slot. */
  imageUrl?: string | null;
}

function EngravedText({
  box,
  lines,
  metal,
  fontFamily = "var(--b-font-display)",
  uppercase = false,
}: {
  box: Box;
  lines: string[];
  metal: Metal;
  fontFamily?: string;
  uppercase?: boolean;
}) {
  if (lines.length === 0) return null;
  const size = fitTextSize(box, lines);
  const lineHeight = size * 1.3;
  const top = box.y + box.h / 2 - (lineHeight * (lines.length - 1)) / 2;
  const cx = box.x + box.w / 2;
  return (
    <g
      textAnchor="middle"
      fontSize={size}
      style={{
        fontFamily,
        fontStretch: "normal",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: uppercase ? "uppercase" : undefined,
      }}
    >
      {lines.map((line, i) => (
        <g key={i}>
          <text x={cx} y={top + i * lineHeight + size * 0.05} dy="0.35em" fill={metal.glow}>
            {line}
          </text>
          <text x={cx} y={top + i * lineHeight} dy="0.35em" fill={metal.ink}>
            {line}
          </text>
        </g>
      ))}
    </g>
  );
}

function Engraving({ box, engraving, metal }: { box: Box; engraving: VisualEngraving; metal: Metal }) {
  const lines = usedLines(engraving.lines);
  const hasGraphic = Boolean(engraving.symbol || engraving.imageUrl);
  const { graphic, text } = splitEngraveArea(box, hasGraphic, lines.length > 0);
  return (
    <>
      {graphic && engraving.imageUrl && (
        <image
          href={engraving.imageUrl}
          x={graphic.x}
          y={graphic.y}
          width={graphic.w}
          height={graphic.h}
          preserveAspectRatio="xMidYMid meet"
          style={{ filter: "grayscale(1) contrast(1.4)", mixBlendMode: "multiply" }}
          opacity={0.85}
        />
      )}
      {graphic && !engraving.imageUrl && engraving.symbol && (
        <svg x={graphic.x} y={graphic.y} width={graphic.w} height={graphic.h} viewBox="0 0 24 24" overflow="visible">
          <SymbolPaths
            symbol={engraving.symbol}
            initials={engraving.initials}
            fontFamily={engraving.fontFamily}
            color={metal.ink}
          />
        </svg>
      )}
      {text && (
        <EngravedText box={text} lines={lines} metal={metal} fontFamily={engraving.fontFamily} uppercase={engraving.uppercase} />
      )}
    </>
  );
}

/** Scale (px per mm) that fits a w × h mm object inside maxW × maxH px. */
const fit = (wMm: number, hMm: number, maxW: number, maxH: number) => Math.min(maxW / wMm, maxH / hMm);

function draw(p: CatalogProduct, metal: Metal): Drawing {
  const engraveSize = (s: number) => ({ w: p.engraveWidthMm * s, h: p.engraveHeightMm * s });
  const dims = { wLabel: formatMm(p.widthMm), hLabel: formatMm(p.heightMm) };

  switch (p.visual as ProductVisualKey) {
    case "hex-tag": {
      const s = fit(p.widthMm, p.heightMm, 280, 250);
      const r = (p.heightMm * s) / 2;
      const cx = 200;
      const cy = 230;
      const top = cy - r;
      const holeY = top + G.hexTag.holeFromTopMm * s;
      const e = engraveSize(s);
      const engrave = centered(cx, cy + G.hexTag.engraveOffsetYMm * s, e.w, e.h);
      return {
        body: (
          <>
            <ellipse cx={cx} cy={holeY - 52} rx={44} ry={54} fill="none" stroke="#c3c7cc" strokeWidth={5} />
            <polygon
              points={hexagon(cx + 3, cy + 4, r)}
              fill={metal.edge}
              strokeLinejoin="round"
              stroke={metal.edge}
              strokeWidth={10}
            />
            <path
              d={`M${hexagon(cx, cy, r).replace(/ /g, "L")}Z${circlePath(cx, holeY, (G.hexTag.holeDiameterMm / 2) * s)}`}
              fill={metal.fill}
              fillRule="evenodd"
              stroke={metal.fill}
              strokeWidth={10}
              strokeLinejoin="round"
            />
            <polygon points={hexagon(cx, cy, r - 9)} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
          </>
        ),
        outline: { box: centered(cx, cy, p.widthMm * s, p.heightMm * s), ...dims },
        engrave,
      };
    }

    case "coin-pendant": {
      const s = fit(p.widthMm, p.heightMm, 250, 240);
      const r = (p.widthMm * s) / 2;
      const cx = 200;
      const cy = 235;
      const e = engraveSize(s);
      return {
        body: (
          <>
            {[-1, 1].map((dir) => (
              <path
                key={dir}
                d={`M${cx},${cy - r - 34} C${cx + dir * 50},${cy - r - 70} ${cx + dir * 120},${cy - r - 110} ${cx + dir * 175},${cy - r - 150}`}
                fill="none"
                stroke="#b9bcc0"
                strokeWidth={3}
                strokeDasharray="7 4"
              />
            ))}
            <circle cx={cx} cy={cy - r - 14} r={14} fill="none" stroke="#c9cbce" strokeWidth={5} />
            <rect x={cx - 8} y={cy - r - 40} width={16} height={26} rx={8} fill="url(#mg-silver)" />
            <circle cx={cx + 2} cy={cy + 3} r={r} fill={metal.edge} />
            <circle cx={cx} cy={cy} r={r} fill={metal.fill} />
            <circle cx={cx} cy={cy} r={r - 10} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={1.2} />
            <circle cx={cx} cy={cy} r={r - 9} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
          </>
        ),
        outline: { box: centered(cx, cy, 2 * r, 2 * r), wLabel: `Ø ${formatMm(p.widthMm)}` },
        engrave: centered(cx, cy, e.w, e.h),
      };
    }

    case "cufflinks": {
      // Front face (engraved) beside a side profile showing face, post and toggle bar.
      const gapMm = 10;
      const s = fit(p.widthMm + gapMm + p.depthMm, p.heightMm, 310, 230);
      const face = p.widthMm * s;
      const depth = p.depthMm * s;
      const left = 200 - (face + gapMm * s + depth) / 2;
      const cx = left + face / 2;
      const cy = 200;
      const profileX = left + face + gapMm * s;
      const plate = 2 * s;
      const e = engraveSize(s);
      return {
        body: (
          <>
            <rect x={cx - face / 2 + 3} y={cy - face / 2 + 4} width={face} height={face} rx={12} fill={metal.edge} />
            <rect x={cx - face / 2} y={cy - face / 2} width={face} height={face} rx={12} fill={metal.fill} />
            <rect
              x={cx - face / 2 + 7}
              y={cy - face / 2 + 7}
              width={face - 14}
              height={face - 14}
              rx={7}
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={1.2}
            />
            <rect x={profileX} y={cy - face / 2} width={plate} height={face} rx={plate / 2} fill={metal.fill} />
            <rect x={profileX + plate} y={cy - 0.9 * s} width={depth - plate * 2.4} height={1.8 * s} fill={metal.edge} />
            <rect
              x={profileX + depth - plate * 1.6}
              y={cy - 6.5 * s}
              width={plate * 1.6}
              height={13 * s}
              rx={plate * 0.8}
              fill={metal.fill}
            />
          </>
        ),
        outline: { box: centered(cx, cy, face, face), ...dims },
        engrave: centered(cx, cy, e.w, e.h),
      };
    }

    case "spoon": {
      const s = fit(p.widthMm, p.heightMm, 330, 200);
      const len = p.widthMm * s;
      const x0 = 200 - len / 2;
      const x1 = 200 + len / 2;
      const cy = 200;
      const bowlRx = (G.spoon.bowlLengthMm / 2) * s;
      const bowlRy = (p.heightMm * s) / 2;
      const paddle = G.spoon.paddleHalfWidthMm * s;
      const e = engraveSize(s);
      const handle = `M${x0 + bowlRx * 1.9},${cy - 5} C${x0 + len * 0.55},${cy - 8} ${x0 + len * 0.7},${cy - paddle} ${x1 - paddle},${cy - paddle}
        Q${x1},${cy - paddle} ${x1},${cy} Q${x1},${cy + paddle} ${x1 - paddle},${cy + paddle}
        C${x0 + len * 0.7},${cy + paddle} ${x0 + len * 0.55},${cy + 8} ${x0 + bowlRx * 1.9},${cy + 5} Z`;
      return {
        body: (
          <>
            <path d={handle} fill={metal.edge} transform="translate(2,3)" />
            <ellipse cx={x0 + bowlRx + 2} cy={cy + 3} rx={bowlRx} ry={bowlRy} fill={metal.edge} />
            <path d={handle} fill={metal.fill} />
            <ellipse cx={x0 + bowlRx} cy={cy} rx={bowlRx} ry={bowlRy} fill={metal.fill} />
            <ellipse cx={x0 + bowlRx} cy={cy} rx={bowlRx - 7} ry={bowlRy - 6} fill="rgba(0,0,0,0.08)" />
            <ellipse cx={x0 + bowlRx - 10} cy={cy - 8} rx={bowlRx * 0.45} ry={bowlRy * 0.3} fill="rgba(255,255,255,0.5)" />
          </>
        ),
        outline: { box: centered(200, cy, len, p.heightMm * s), ...dims },
        engrave: centered(x1 - G.spoon.engraveEndInsetMm * s - e.w / 2, cy, e.w, e.h),
      };
    }

    case "lighter": {
      const s = fit(p.widthMm, p.heightMm, 200, 290);
      const w = p.widthMm * s;
      const h = p.heightMm * s;
      const box = centered(200, 200, w, h);
      const lidH = G.lighter.lidHeightMm * s;
      const e = engraveSize(s);
      const bodyCy = box.y + lidH + (h - lidH) / 2;
      return {
        body: (
          <>
            <rect x={box.x + 4} y={box.y + 5} width={w} height={h} rx={18} fill={metal.edge} />
            <rect x={box.x} y={box.y} width={w} height={h} rx={18} fill={metal.fill} />
            <rect x={box.x} y={box.y} width={w} height={h} rx={18} fill="url(#mg-sheen)" opacity={0.45} />
            <line x1={box.x} y1={box.y + lidH} x2={box.x + w} y2={box.y + lidH} stroke={metal.edge} strokeWidth={2.5} />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={box.x + w - 7} y={box.y + lidH - 22 + i * 15} width={9} height={11} rx={2} fill={metal.edge} />
            ))}
          </>
        ),
        outline: { box, ...dims },
        engrave: centered(200, bodyCy, e.w, e.h),
      };
    }

    case "cardholder": {
      const s = fit(p.widthMm, p.heightMm, 300, 230);
      const w = p.widthMm * s;
      const h = p.heightMm * s;
      const box = centered(200, 200, w, h);
      const band = { x: box.x + G.cardholder.bandFromLeftMm * s, w: G.cardholder.bandWidthMm * s };
      const e = engraveSize(s);
      const engraveCx = (band.x + band.w + box.x + w) / 2;
      return {
        body: (
          <>
            <rect x={box.x + 9} y={box.y + 9} width={w} height={h} rx={10} fill="#4a4d51" />
            <rect x={box.x} y={box.y} width={w} height={h} rx={10} fill={metal.fill} />
            <rect x={band.x} y={box.y - 6} width={band.w} height={h + 12} rx={3} fill="#1d1e21" />
            {[
              [box.x + 12, box.y + 12],
              [box.x + w - 12, box.y + 12],
              [box.x + 12, box.y + h - 12],
              [box.x + w - 12, box.y + h - 12],
            ].map(([x, y]) => (
              <g key={`${x}-${y}`}>
                <circle cx={x} cy={y} r={5.5} fill="#55595d" />
                <circle cx={x} cy={y} r={2.2} fill="#2c2e31" />
              </g>
            ))}
          </>
        ),
        outline: { box, ...dims },
        engrave: centered(engraveCx, 200, e.w, e.h),
      };
    }

    case "flask": {
      const s = fit(p.widthMm, p.heightMm, 230, 290);
      const w = p.widthMm * s;
      const h = p.heightMm * s;
      const box = centered(200, 200, w, h);
      const { x: L, y: T } = box;
      const R = L + w;
      const B = T + h;
      const capW = G.flask.capWidthMm * s;
      const capH = G.flask.capHeightMm * s;
      const shoulder = T + capH + G.flask.shoulderDropMm * s;
      const panelTop = shoulder + G.flask.shoulderMm * s;
      const outline = `M${200 - capW * 0.4},${shoulder} C${L + 40},${shoulder} ${L},${shoulder + 18} ${L},${panelTop}
        L${L},${B - 26} Q${L},${B} ${L + 26},${B} L${R - 26},${B} Q${R},${B} ${R},${B - 26}
        L${R},${panelTop} C${R},${shoulder + 18} ${R - 40},${shoulder} ${200 + capW * 0.4},${shoulder} Z`;
      const e = engraveSize(s);
      return {
        body: (
          <>
            <path d={outline} fill={metal.edge} transform="translate(3,4)" />
            <path d={outline} fill={metal.fill} />
            <path d={outline} fill="url(#mg-sheen)" opacity={0.5} />
            <rect x={200 - capW * 0.3} y={T + capH - 4} width={capW * 0.6} height={12} fill={metal.edge} />
            <rect x={200 - capW / 2} y={T} width={capW} height={capH} rx={6} fill={metal.fill} />
            {Array.from({ length: 9 }, (_, i) => (
              <line
                key={i}
                x1={200 - capW / 2 + 8 + i * ((capW - 16) / 8)}
                y1={T + 5}
                x2={200 - capW / 2 + 8 + i * ((capW - 16) / 8)}
                y2={T + capH - 5}
                stroke={metal.edge}
                strokeWidth={1}
                opacity={0.6}
              />
            ))}
            <path
              d={`M${200 + capW / 2 - 4},${T + capH / 2} q22,4 26,${shoulder - T}`}
              fill="none"
              stroke={metal.edge}
              strokeWidth={3}
            />
          </>
        ),
        outline: { box, ...dims },
        engrave: centered(200, (panelTop + B) / 2 - G.flask.shoulderDropMm * s, e.w, e.h),
      };
    }

    case "keyfob": {
      const s = fit(p.widthMm, p.heightMm, 300, 160);
      const w = p.widthMm * s;
      const h = p.heightMm * s;
      const box = centered(200, 225, w, h);
      const hole = { x: box.x + G.keyfob.holeFromLeftMm * s, y: 225, r: (G.keyfob.holeDiameterMm / 2) * s };
      const e = engraveSize(s);
      return {
        body: (
          <>
            <circle cx={hole.x - 26} cy={hole.y - 34} r={43} fill="none" stroke="#c3c7cc" strokeWidth={5} />
            <rect x={box.x + 4} y={box.y + 5} width={w} height={h} rx={h / 2} fill={metal.edge} />
            <path
              d={`M${box.x + h / 2},${box.y} H${box.x + w - h / 2} A${h / 2},${h / 2} 0 0 1 ${box.x + w - h / 2},${box.y + h}
                H${box.x + h / 2} A${h / 2},${h / 2} 0 0 1 ${box.x + h / 2},${box.y} Z ${circlePath(hole.x, hole.y, hole.r)}`}
              fill={metal.fill}
              fillRule="evenodd"
            />
            <rect
              x={box.x + 8}
              y={box.y + 8}
              width={w - 16}
              height={h - 16}
              rx={h / 2 - 8}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1.2}
            />
          </>
        ),
        outline: { box, ...dims },
        engrave: centered(box.x + G.keyfob.engraveFromLeftMm * s + (p.engraveWidthMm * s) / 2, 225, e.w, e.h),
      };
    }

    case "plaque": {
      const s = fit(p.widthMm, p.heightMm, 310, 240);
      const w = p.widthMm * s;
      const h = p.heightMm * s;
      const box = centered(200, 200, w, h);
      const plate = centered(200, 200, G.plates.plaque.widthMm * s, G.plates.plaque.heightMm * s);
      const e = engraveSize(s);
      return {
        body: (
          <>
            <rect x={box.x + 5} y={box.y + 6} width={w} height={h} rx={4} fill="#2e1f14" />
            <rect x={box.x} y={box.y} width={w} height={h} rx={4} fill="url(#mg-walnut)" />
            <rect
              x={box.x + 6}
              y={box.y + 6}
              width={w - 12}
              height={h - 12}
              rx={2}
              fill="none"
              stroke="rgba(255,225,190,0.18)"
              strokeWidth={1.5}
            />
            <rect x={plate.x + 2} y={plate.y + 3} width={plate.w} height={plate.h} fill={metal.edge} />
            <rect x={plate.x} y={plate.y} width={plate.w} height={plate.h} fill={metal.fill} />
            {[
              [plate.x + 9, plate.y + 9],
              [plate.x + plate.w - 9, plate.y + 9],
              [plate.x + 9, plate.y + plate.h - 9],
              [plate.x + plate.w - 9, plate.y + plate.h - 9],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={3.5} fill={metal.edge} />
            ))}
          </>
        ),
        outline: { box, ...dims },
        engrave: centered(200, 200, e.w, e.h),
      };
    }

    case "nameplate": {
      const s = fit(p.widthMm, p.heightMm, 320, 200);
      const w = p.widthMm * s;
      const h = p.heightMm * s;
      const box = centered(200, 200, w, h);
      const plateH = G.plates.nameplate.heightMm * s * Math.cos((15 * Math.PI) / 180);
      const baseY = box.y + plateH;
      const e = engraveSize(s);
      return {
        body: (
          <>
            <ellipse cx={200} cy={box.y + h + 10} rx={w * 0.52} ry={9} fill="rgba(0,0,0,0.18)" />
            <rect x={box.x} y={baseY - 4} width={w} height={box.y + h - baseY + 4} rx={3} fill="url(#mg-walnut)" />
            <rect x={box.x + 2} y={box.y + 3} width={w} height={plateH} fill={metal.edge} />
            <rect x={box.x} y={box.y} width={w} height={plateH} fill={metal.fill} />
            <rect x={box.x} y={box.y} width={w} height={plateH} fill="url(#mg-sheen)" opacity={0.35} />
          </>
        ),
        outline: { box, ...dims },
        engrave: centered(200, box.y + plateH / 2, e.w, e.h * Math.cos((15 * Math.PI) / 180)),
      };
    }

    case "bowl-stand": {
      const s = fit(p.widthMm, p.heightMm, 340, 200);
      const w = p.widthMm * s;
      const h = p.heightMm * s;
      const front = centered(200, 238, w, h);
      const topH = p.depthMm * s * 0.3;
      const bowlRx = 70 * s;
      const plate = centered(200, front.y + h / 2, G.plates["bowl-stand"].widthMm * s, G.plates["bowl-stand"].heightMm * s);
      const e = engraveSize(s);
      return {
        body: (
          <>
            <path
              d={`M${front.x + 26},${front.y - topH} H${front.x + w - 26} L${front.x + w},${front.y} H${front.x} Z`}
              fill="url(#mg-oak-top)"
            />
            {[front.x + w * 0.27, front.x + w * 0.73].map((cx) => (
              <g key={cx}>
                <ellipse cx={cx} cy={front.y - topH / 2} rx={bowlRx} ry={topH * 0.36} fill="url(#mg-ceramic)" />
                <ellipse cx={cx} cy={front.y - topH / 2 + 1} rx={bowlRx - 9} ry={topH * 0.36 - 5} fill="url(#mg-bowl-inner)" />
              </g>
            ))}
            <rect x={front.x} y={front.y} width={w} height={h} fill="url(#mg-oak)" />
            <line x1={front.x} y1={front.y + 0.5} x2={front.x + w} y2={front.y + 0.5} stroke="rgba(255,255,255,0.4)" />
            {[front.x + 14, front.x + w - 34].map((x) => (
              <rect key={x} x={x} y={front.y + h} width={20} height={6} rx={2} fill="#2b2420" />
            ))}
            <rect x={plate.x + 1.5} y={plate.y + 2} width={plate.w} height={plate.h} fill={metal.edge} />
            <rect x={plate.x} y={plate.y} width={plate.w} height={plate.h} fill={metal.fill} />
          </>
        ),
        outline: { box: front, ...dims },
        engrave: centered(200, plate.y + plate.h / 2, e.w, e.h),
      };
    }

    case "collar": {
      const cx = 200;
      const cy = 190;
      const rx = 135;
      const ry = 100;
      const s = rx / (p.widthMm / Math.PI / 2);
      const strap = p.heightMm * s;
      const plate = centered(cx, cy + ry, G.plates.collar.widthMm * s, G.plates.collar.heightMm * s);
      const e = engraveSize(s);
      return {
        body: (
          <>
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="url(#mg-leather)" strokeWidth={strap} />
            <path
              d={`M${cx - rx},${cy} A${rx},${ry} 0 0 1 ${cx + rx},${cy}`}
              fill="none"
              stroke="rgba(0,0,0,0.28)"
              strokeWidth={strap}
            />
            {[strap / 2 - 5, -(strap / 2 - 5)].map((offset) => (
              <ellipse
                key={offset}
                cx={cx}
                cy={cy}
                rx={rx + offset}
                ry={ry + offset}
                fill="none"
                stroke="#e9d2a6"
                strokeOpacity={0.6}
                strokeWidth={1.2}
                strokeDasharray="5 4"
              />
            ))}
            <rect
              x={cx - rx - strap / 2 - 8}
              y={cy - 30}
              width={strap + 16}
              height={60}
              rx={10}
              fill="none"
              stroke="url(#mg-brass)"
              strokeWidth={6}
            />
            <line
              x1={cx - rx - strap / 2 - 8}
              y1={cy}
              x2={cx - rx + strap / 2 + 4}
              y2={cy}
              stroke="url(#mg-brass)"
              strokeWidth={4}
            />
            <rect x={plate.x + 1.5} y={plate.y + 2} width={plate.w} height={plate.h} rx={3} fill={metal.edge} />
            <rect x={plate.x} y={plate.y} width={plate.w} height={plate.h} rx={3} fill={metal.fill} />
            {[plate.x + 7, plate.x + plate.w - 7].map((x) => (
              <circle key={x} cx={x} cy={plate.y + plate.h / 2} r={3.6} fill="#a2552f" stroke="#6b3518" strokeWidth={1} />
            ))}
          </>
        ),
        engrave: centered(cx, plate.y + plate.h / 2, e.w, e.h),
      };
    }
  }
}

function Annotations({ drawing, product }: { drawing: Drawing; product: CatalogProduct }) {
  const { outline, engrave } = drawing;
  const label = `ZONĂ GRAVURĂ ${formatMm(product.engraveWidthMm, product.engraveHeightMm)}`;
  return (
    <g fill="currentColor" stroke="currentColor" style={{ fontFamily: "var(--b-font-mono)" }} fontSize={10}>
      <rect
        x={engrave.x}
        y={engrave.y}
        width={engrave.w}
        height={engrave.h}
        fill="none"
        stroke="var(--b-metal)"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={engrave.x} y={engrave.y - 6} stroke="none" fill="var(--b-metal-text)" fontSize={9} letterSpacing="0.08em">
        {label}
      </text>
      {outline && (
        <g strokeWidth={0.8} opacity={0.75}>
          {(() => {
            const { box, wLabel, hLabel } = outline;
            const y = Math.min(box.y + box.h + 20, VB - 22);
            const x = Math.min(box.x + box.w + 20, VB - 14);
            return (
              <>
                <line x1={box.x} y1={y} x2={box.x + box.w} y2={y} />
                <line x1={box.x} y1={y - 5} x2={box.x} y2={y + 5} />
                <line x1={box.x + box.w} y1={y - 5} x2={box.x + box.w} y2={y + 5} />
                <text x={box.x + box.w / 2} y={y + 15} textAnchor="middle" stroke="none">
                  {wLabel}
                </text>
                {hLabel && (
                  <>
                    <line x1={x} y1={box.y} x2={x} y2={box.y + box.h} />
                    <line x1={x - 5} y1={box.y} x2={x + 5} y2={box.y} />
                    <line x1={x - 5} y1={box.y + box.h} x2={x + 5} y2={box.y + box.h} />
                    <text
                      x={x + 12}
                      y={box.y + box.h / 2}
                      textAnchor="middle"
                      stroke="none"
                      transform={`rotate(-90 ${x + 12} ${box.y + box.h / 2})`}
                    >
                      {hLabel}
                    </text>
                  </>
                )}
              </>
            );
          })()}
        </g>
      )}
    </g>
  );
}

export function ProductVisual({
  product,
  showDimensions = false,
  className,
  engraving,
  material,
  tint,
}: {
  product: CatalogProduct;
  showDimensions?: boolean;
  className?: string;
  /** Replaces the sample text with the customer's engraving. */
  engraving?: VisualEngraving;
  /** Finish material to paint, when the chosen variant changes the metal. */
  material?: Material;
  /** Finish colour from finishTint(). */
  tint?: string;
}) {
  const base = (material && METALS[material]) || METALS[product.material] || METALS.BRASS!;
  const darkFinish = tint !== undefined && isDarkFinish(tint);
  const metal = darkFinish ? { ...base, ink: "#eef0f2", glow: "rgba(0,0,0,0.45)" } : base;
  const drawing = draw(product, metal);
  const tintId = tint && `mv-tint-${tint.slice(1)}`;
  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} role="img" aria-label={product.name} className={className}>
      {tint && tintId && (
        <defs>
          <TintFilter id={tintId} tint={tint} />
        </defs>
      )}
      <g filter="url(#mv-shadow)">
        <g filter={tintId ? `url(#${tintId})` : undefined}>{drawing.body}</g>
      </g>
      {/* A light finish colours the cut too; a dark one is cut through, so the engraving stays bright. */}
      <g filter={tintId && !darkFinish ? `url(#${tintId})` : undefined}>
        {engraving ? (
          <Engraving box={drawing.engrave} engraving={engraving} metal={metal} />
        ) : (
          <EngravedText box={drawing.engrave} lines={product.sampleEngraving} metal={metal} />
        )}
      </g>
      {showDimensions && <Annotations drawing={drawing} product={product} />}
    </svg>
  );
}
