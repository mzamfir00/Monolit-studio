import {
  Archivo,
  Bodoni_Moda,
  Cinzel,
  Cormorant_Garamond,
  EB_Garamond,
  Fraunces,
  Great_Vibes,
  IBM_Plex_Mono,
  Inter,
  JetBrains_Mono,
  Montserrat,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";

// latin-ext carries ă â î ș ț. Every family is exposed as a CSS variable on <html> so any element can
// opt into any atelier's typography through `data-branch`; only the umbrella pair is preloaded.

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
});

const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: false,
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
  preload: false,
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});

// Engraving typefaces offered in the configurator (see ENGRAVING_FONTS in src/lib/engraving.ts).

const ebGaramond = EB_Garamond({
  subsets: ["latin", "latin-ext"],
  variable: "--font-eb-garamond",
  display: "swap",
  preload: false,
});

const greatVibes = Great_Vibes({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
  preload: false,
});

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});

const cinzel = Cinzel({
  subsets: ["latin", "latin-ext"],
  variable: "--font-cinzel",
  display: "swap",
  preload: false,
});

export const fontVariables = [
  cormorant,
  jakarta,
  fraunces,
  bodoni,
  inter,
  spaceGrotesk,
  jetbrains,
  archivo,
  plexMono,
  ebGaramond,
  greatVibes,
  montserrat,
  cinzel,
]
  .map((font) => font.variable)
  .join(" ");
