// Vector symbol library for the engraving configurator. Paths live on a 24 × 24 grid and are drawn as
// single strokes (diamond drag friendly) unless marked `fill`; the admin SVG export reuses them as-is.

import type { SymbolSet } from "./types";

export interface SymbolPath {
  d: string;
  fill?: boolean;
  transform?: string;
}

export interface SymbolDef {
  key: string;
  name: string;
  category: SymbolSet;
  /** Sub-group inside a category (the twelve zodiac signs). */
  group?: "zodiac";
  paths: SymbolPath[];
  /** Where the customer's initials are set inside the symbol (monogram crest). */
  monogramSlot?: { x: number; y: number; size: number };
}

const round = (n: number) => Math.round(n * 100) / 100;

function circle(cx: number, cy: number, r: number) {
  return `M${round(cx - r)} ${cy}a${r} ${r} 0 1 0 ${round(2 * r)} 0a${r} ${r} 0 1 0 ${round(-2 * r)} 0Z`;
}

function ellipse(cx: number, cy: number, rx: number, ry: number) {
  return `M${round(cx - rx)} ${cy}a${rx} ${ry} 0 1 0 ${round(2 * rx)} 0a${rx} ${ry} 0 1 0 ${round(-2 * rx)} 0Z`;
}

function star(cx: number, cy: number, outer: number, inner: number, points = 5) {
  const vertices = Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    return `${round(cx + r * Math.cos(a))} ${round(cy + r * Math.sin(a))}`;
  });
  return `M${vertices.join("L")}Z`;
}

/** Almond-shaped leaf centred on (x, y), pointing along `angle` degrees. */
function leaf(x: number, y: number, angle: number, length = 3.4, width = 1.5) {
  const a = (angle * Math.PI) / 180;
  const dx = (Math.cos(a) * length) / 2;
  const dy = (Math.sin(a) * length) / 2;
  const nx = -Math.sin(a) * width;
  const ny = Math.cos(a) * width;
  const [x0, y0, x1, y1] = [x - dx, y - dy, x + dx, y + dy];
  return `M${round(x0)} ${round(y0)}Q${round(x + nx)} ${round(y + ny)} ${round(x1)} ${round(y1)}Q${round(x - nx)} ${round(y - ny)} ${round(x0)} ${round(y0)}Z`;
}

/** Paired leaves along the left branch of a wreath (circle centred on 12,12), mirrored for the right one. */
function laurelBranch(side: -1 | 1) {
  const r = 8.2;
  const at = (deg: number) => {
    const t = (deg * Math.PI) / 180;
    return [12 + r * Math.cos(t), 12 - r * Math.sin(t)];
  };
  const leaves: string[] = [];
  for (const deg of [236, 208, 180, 152, 124]) {
    const [x, y] = at(deg);
    const [nx, ny] = at(deg - 6);
    const heading = (Math.atan2(ny - y, nx - x) * 180) / Math.PI;
    for (const tilt of [-38, 38]) {
      const a = ((heading + tilt) * Math.PI) / 180;
      const cx = x + Math.cos(a) * 1.5;
      const cy = y + Math.sin(a) * 1.5;
      const mirroredX = side === -1 ? cx : 24 - cx;
      const angle = side === -1 ? heading + tilt : 180 - (heading + tilt);
      leaves.push(leaf(mirroredX, cy, angle, 3, 1.1));
    }
  }
  return leaves.join("");
}

const ZODIAC: Array<[key: string, name: string, paths: SymbolPath[]]> = [
  [
    "aries",
    "Berbec",
    [{ d: "M12 20V9M12 9c0-3-1.8-5-4.2-5S4 5.8 4 8s1.4 3 2.5 3M12 9c0-3 1.8-5 4.2-5S20 5.8 20 8s-1.4 3-2.5 3" }],
  ],
  ["taurus", "Taur", [{ d: `${circle(12, 15, 5)}M4 4c1 3.5 4 5.5 8 5.5s7-2 8-5.5` }]],
  ["gemini", "Gemeni", [{ d: "M5 4c4 1.6 10 1.6 14 0M5 20c4-1.6 10-1.6 14 0M9 5.2v13.6M15 5.2v13.6" }]],
  [
    "cancer",
    "Rac",
    [
      {
        d: `M19.5 9C17.5 6 15 5 12 5 7.5 5 4 7 4 10${circle(6.5, 10, 2.5)}M4.5 15c2 3 4.5 4 7.5 4 4.5 0 8-2 8-5${circle(17.5, 14, 2.5)}`,
      },
    ],
  ],
  ["leo", "Leu", [{ d: `${circle(7, 15.5, 2.5)}M9.5 15.5C9 12 8 10 8 7.8a4 4 0 0 1 8 0c0 3.2-3 5.6-3 9a2.5 2.5 0 0 0 5 0` }]],
  [
    "virgo",
    "Fecioară",
    [
      {
        d: "M4 6.5c1.4 0 2 1 2 2.5v9M6 9c0-1.5 1-2.5 2.5-2.5S11 7.5 11 9v9M11 9c0-1.5 1-2.5 2.5-2.5S16 7.5 16 9v6.5c0 2 1.2 3.5 3 3.5M16 14.5c1.2-1.2 4-1.4 4 .8 0 2.4-2.6 4-5.6 5.2",
      },
    ],
  ],
  ["libra", "Balanță", [{ d: "M4 20h16M4 16h5.3a4 4 0 1 1 5.4 0H20" }]],
  [
    "scorpio",
    "Scorpion",
    [
      {
        d: "M4 6.5c1.4 0 2 1 2 2.5v9M6 9c0-1.5 1-2.5 2.5-2.5S11 7.5 11 9v9M11 9c0-1.5 1-2.5 2.5-2.5S16 7.5 16 9v8c0 1.2.8 2 2 2h3M19 17l2 2-2 2",
      },
    ],
  ],
  ["sagittarius", "Săgetător", [{ d: "M5 19 19 5M12 5h7v7M7.5 11.5l5 5" }]],
  [
    "capricorn",
    "Capricorn",
    [{ d: "M4 6c1.5 0 2.5 1 2.5 3v9M6.5 9c0-2 1.2-3.5 3-3.5s3 1.5 3 3.5v7.5c0 2 1.4 3 3 3a3 3 0 1 0-3-4.5" }],
  ],
  ["aquarius", "Vărsător", [{ d: "M3 10l3-3 3 3 3-3 3 3 3-3 3 3M3 17l3-3 3 3 3-3 3 3 3-3 3 3" }]],
  ["pisces", "Pești", [{ d: "M5 4c3 2.5 4 5 4 8s-1 5.5-4 8M19 4c-3 2.5-4 5-4 8s1 5.5 4 8M6.5 12h11" }]],
];

export const SYMBOLS: SymbolDef[] = [
  // Pet
  {
    key: "paw",
    name: "Lăbuță",
    category: "pet",
    paths: [
      {
        d: "M12 13.2c-2.7 0-5.2 2.4-5.2 4.8 0 1.6 1.3 2.5 2.8 2.5.9 0 1.5-.4 2.4-.4s1.5.4 2.4.4c1.5 0 2.8-.9 2.8-2.5 0-2.4-2.5-4.8-5.2-4.8Z",
        fill: true,
      },
      { d: ellipse(5.8, 10.4, 1.7, 2.2), fill: true, transform: "rotate(-22 5.8 10.4)" },
      { d: ellipse(9.4, 6.6, 1.8, 2.4), fill: true, transform: "rotate(-8 9.4 6.6)" },
      { d: ellipse(14.6, 6.6, 1.8, 2.4), fill: true, transform: "rotate(8 14.6 6.6)" },
      { d: ellipse(18.2, 10.4, 1.7, 2.2), fill: true, transform: "rotate(22 18.2 10.4)" },
    ],
  },
  {
    key: "bone",
    name: "Os",
    category: "pet",
    paths: [
      {
        d: "M16.54 10.4A2.4 2.4 0 1 1 18.8 12a2.4 2.4 0 1 1-2.26 1.6H7.46A2.4 2.4 0 1 1 5.2 12a2.4 2.4 0 1 1 2.26-1.6Z",
        transform: "rotate(-35 12 12)",
      },
    ],
  },
  {
    key: "crown",
    name: "Coroană",
    category: "pet",
    paths: [
      { d: "M3.5 8.5 7.5 12 12 5.5l4.5 6.5 4-3.5-1.5 8.5H5ZM5 20h14" },
      { d: `${circle(3.5, 7.6, 0.9)}${circle(12, 4.4, 0.9)}${circle(20.5, 7.6, 0.9)}`, fill: true },
    ],
  },
  {
    key: "heart",
    name: "Inimă",
    category: "pet",
    paths: [{ d: "M12 20.2S3.6 15.4 3.6 9.4A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 8.4 1.8c0 6-8.4 10.8-8.4 10.8Z" }],
  },
  {
    key: "mountain",
    name: "Munte",
    category: "pet",
    paths: [{ d: `M2 20 9 8.5l4 6 3-4 6 9.5ZM7.3 11.3 9 8.5l1.8 2.8-1 .9-.9-.9-.8.9Z${circle(18, 5.5, 1.7)}` }],
  },

  // Jewelry
  {
    key: "infinity",
    name: "Infinit",
    category: "jewelry",
    paths: [
      {
        d: "M12 12c-2-2.7-3.6-4-5.5-4a4 4 0 0 0 0 8c1.9 0 3.5-1.3 5.5-4Zm0 0c2 2.7 3.6 4 5.5 4a4 4 0 0 0 0-8c-1.9 0-3.5 1.3-5.5 4Z",
      },
    ],
  },
  { key: "cross", name: "Cruce", category: "jewelry", paths: [{ d: "M10.6 3h2.8v5.2h4.8V11h-4.8v10h-2.8V11H5.8V8.2h4.8Z" }] },
  { key: "star", name: "Stea", category: "jewelry", paths: [{ d: star(12, 12.6, 9.4, 3.9) }] },
  {
    key: "floral",
    name: "Floral",
    category: "jewelry",
    paths: [
      ...Array.from({ length: 6 }, (_, i) => ({ d: ellipse(12, 6.7, 2.3, 3.5), transform: `rotate(${i * 60} 12 12)` })),
      { d: circle(12, 12, 1.8), fill: true },
    ],
  },
  ...ZODIAC.map(([key, name, paths]): SymbolDef => ({ key: `zodiac-${key}`, name, category: "jewelry", group: "zodiac", paths })),

  // EDC
  {
    key: "compass",
    name: "Busolă",
    category: "edc",
    paths: [
      { d: circle(12, 12, 10) },
      { d: "M12 3.8 13.5 10.5 20.2 12 13.5 13.5 12 20.2 10.5 13.5 3.8 12 10.5 10.5Z" },
      { d: "M12 3.8 13.5 10.5 12 12 10.5 10.5Z", fill: true },
    ],
  },
  {
    key: "anchor",
    name: "Ancoră",
    category: "edc",
    paths: [
      {
        d: `${circle(12, 4.6, 1.9)}M12 6.5V21M8 9.5h8M4.5 13.5c0 4.3 3.4 7.5 7.5 7.5s7.5-3.2 7.5-7.5M3 15.2l1.5-1.7 1.7 1.5M21 15.2l-1.5-1.7-1.7 1.5`,
      },
    ],
  },
  {
    key: "shield",
    name: "Scut",
    category: "edc",
    paths: [{ d: "M12 3 19.5 5.6v6c0 4.8-3.2 8.2-7.5 9.4-4.3-1.2-7.5-4.6-7.5-9.4v-6ZM8 10.2l4 3.2 4-3.2" }],
  },
  {
    key: "monogram-crest",
    name: "Blazon monogramă",
    category: "edc",
    paths: [
      { d: "M8.6 5.6 8.2 2.7l2 1.5L12 2l1.8 2.2 2-1.5-.4 2.9Z" },
      { d: "M6.2 6.6h11.6v6.2c0 4-2.7 6.8-5.8 8.1-3.1-1.3-5.8-4.1-5.8-8.1Z" },
      { d: "M4.4 8.8c-.7 3.6.5 7.4 3.6 9.9M19.6 8.8c.7 3.6-.5 7.4-3.6 9.9" },
    ],
    monogramSlot: { x: 12, y: 12.6, size: 4.6 },
  },
  {
    key: "laurel",
    name: "Lauri",
    category: "edc",
    paths: [
      { d: "M10.4 20.3A8.2 8.2 0 0 1 7.4 5.2M13.6 20.3a8.2 8.2 0 0 0 3-15.1" },
      { d: laurelBranch(-1) + laurelBranch(1), fill: true },
    ],
  },
];

export const SYMBOL_CATEGORIES: Array<{ key: SymbolSet; label: string }> = [
  { key: "pet", label: "Animale" },
  { key: "jewelry", label: "Bijuterii & zodiac" },
  { key: "edc", label: "EDC & blazoane" },
];

const BY_KEY = new Map(SYMBOLS.map((symbol) => [symbol.key, symbol]));

export function getSymbol(key: string | null | undefined): SymbolDef | undefined {
  return key ? BY_KEY.get(key) : undefined;
}
