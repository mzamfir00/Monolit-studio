import type { Atelier, Branch, Machine } from "./types";
import { BRANCHES } from "./types";

export interface Pillar {
  icon:
    | "shield"
    | "layers"
    | "phone"
    | "gem"
    | "sparkles"
    | "gift"
    | "flame"
    | "crosshair"
    | "hourglass"
    | "calculator"
    | "receipt"
    | "factory";
  title: string;
  body: string;
}

export interface AtelierConfig {
  key: Atelier;
  href: string;
  name: string;
  /** Label in the Atelier Switcher. */
  shortName: string;
  category: string;
  tagline: string;
  eyebrow: string;
  heroTitle: string;
  /** Words of heroTitle set in the atelier's accent style (italic, molten copper…). */
  heroAccent?: string;
  heroLead: string;
  /** Font pairing as named in CLAUDE.md; shown on the umbrella atelier selector. */
  typePairing: string;
  heroProductSlug?: string;
  machine?: Machine;
  pillars: Pillar[];
  collectionTitle: string;
  collectionLead: string;
}

export const ATELIERS: Record<Atelier, AtelierConfig> = {
  umbrella: {
    key: "umbrella",
    href: "/",
    name: "Maison Gravure",
    shortName: "Maison Gravure",
    category: "Atelierul-mamă",
    tagline: "Gravură mecanică pentru o viață întreagă.",
    eyebrow: "Atelier de gravură mecanică · România",
    heroTitle: "Gravură mecanică, pentru o viață întreagă.",
    heroLead:
      "Trei mașini Gravograph M20, un vârf de diamant și o freză din carbură. Gravăm alamă masivă, argint 925, titan și inox — la milimetru, fără laser, pentru piese care se moștenesc.",
    typePairing: "Cormorant Garamond · Plus Jakarta Sans",
    pillars: [],
    collectionTitle: "Capodopere din toate atelierele",
    collectionLead: "Câte o piesă-reper din fiecare atelier, gravată pe mașina potrivită metalului.",
  },
  pet: {
    key: "pet",
    href: "/pet",
    name: "Maison Pedigree",
    shortName: "Pedigree",
    category: "Animale de companie",
    tagline: "Identitate în alamă masivă pentru cei care nu pot spune cine sunt.",
    eyebrow: "Atelier pentru animale de companie",
    heroTitle: "Numele lor, gravat în alamă masivă.",
    heroAccent: "alamă masivă",
    heroLead:
      "Medalioane grele, zgărzi din piele vegetală și boluri din stejar — fiecare gravat mecanic, în adâncime, ca să reziste unei vieți întregi de alergat prin iarbă.",
    typePairing: "Fraunces · Plus Jakarta Sans",
    heroProductSlug: "medalion-hexagonal-alama-masiva",
    machine: "M20_OLD_GEN_1",
    pillars: [
      {
        icon: "shield",
        title: "Alamă de 3 mm",
        body: "Medalioanele sunt tăiate din bară masivă, nu ștanțate din tablă. Nu se îndoaie și nu se rup în dinți.",
      },
      {
        icon: "layers",
        title: "Gravură în adâncime",
        body: "Frezăm rotativ la 0,30 mm. Literele nu se șterg prin frecarea de zgardă, nici după ani de joacă.",
      },
      {
        icon: "phone",
        title: "Verso pentru stăpân",
        body: "Pe spate: telefonul tău și „Cip: Da” — tot ce are nevoie cine îl găsește.",
      },
    ],
    collectionTitle: "Colecția Pedigree",
    collectionLead: "Piese de identificare și de casă, gândite pentru câini care trăiesc afară, la apă și în noroi.",
  },
  jewelry: {
    key: "jewelry",
    href: "/jewelry",
    name: "Maison Aurum",
    shortName: "Aurum",
    category: "Bijuterii & ceremonii",
    tagline: "Argint 925 și lumina unei linii trase cu diamantul.",
    eyebrow: "Bijuterii fine & obiecte de ceremonie",
    heroTitle: "Lumina unei linii trase cu diamantul.",
    heroAccent: "cu diamantul",
    heroLead:
      "Pandantive, butoni și lingurițe de botez din argint 925, gravate pe cea mai nouă mașină M20 din atelier — cu vârf de diamant, pentru o linie strălucitoare pe care laserul nu o poate imita.",
    typePairing: "Bodoni Moda · Inter",
    heroProductSlug: "pandantiv-banut-argint-925",
    machine: "M20_NEW_GEN",
    pillars: [
      {
        icon: "gem",
        title: "Argint 925 masiv",
        body: "Bănuți de 1,2 mm, butoni de 14 g pe pereche, lingurițe de 22 g. Greutate reală, nu placaj.",
      },
      {
        icon: "sparkles",
        title: "Linie de diamant",
        body: "Diamantul comprimă metalul și lasă o linie lucioasă, care prinde lumina la fiecare mișcare.",
      },
      {
        icon: "gift",
        title: "Gata de dăruit",
        body: "La cerere: cutie rigidă de atelier cu inserție de catifea și certificat de gravură mecanică.",
      },
    ],
    collectionTitle: "Colecția Aurum",
    collectionLead: "Bijuterii și obiecte de ceremonie, gravate cu diamantul pe suprafețe de câțiva milimetri.",
  },
  vault: {
    key: "vault",
    href: "/vault",
    name: "The Brass Vault",
    shortName: "Brass Vault",
    category: "EDC · Barware · Executive",
    tagline: "Obiecte grele de purtat zilnic. Gravuri care se simt.",
    eyebrow: "EDC · Barware · Executive",
    heroTitle: "Obiecte grele. Gravuri care se simt.",
    heroAccent: "Gravuri care se simt.",
    heroLead:
      "Brichete din alamă masivă, port-carduri din titan și ploști din inox 316L — obiecte de purtat zilnic, gravate să îmbătrânească odată cu tine.",
    typePairing: "Space Grotesk · JetBrains Mono",
    heroProductSlug: "bricheta-alama-masiva",
    machine: "M20_OLD_GEN_1",
    pillars: [
      {
        icon: "flame",
        title: "Metal masiv, nu placat",
        body: "Alamă cu pereți de 1,5 mm, titan Grad 5, inox 316L. Fără straturi care se cojesc.",
      },
      {
        icon: "crosshair",
        title: "Frezat sau cu diamant",
        body: "Canal rotativ de 0,20 mm pe alamă, linie de diamant pe titan și inox — tehnica aleasă după metal.",
      },
      {
        icon: "hourglass",
        title: "Patina face parte din design",
        body: "Alama brută se închide la culoare în buzunar. Gravura rămâne, doar devine a ta.",
      },
    ],
    collectionTitle: "Inventarul Vault",
    collectionLead: "Unelte de buzunar și de bar, cântărite în grame și gravate în sutimi de milimetru.",
  },
  corporate: {
    key: "corporate",
    href: "/corporate",
    name: "Maison Bespoke",
    shortName: "Bespoke",
    category: "B2B · HoReCa · Cabane",
    tagline: "Identitate gravată, la scară, pentru hoteluri, cabane și companii.",
    eyebrow: "B2B · HoReCa · Cabane montane",
    heroTitle: "Identitate gravată, la scară.",
    heroAccent: "la scară.",
    heroLead:
      "Brelocuri grele pentru cabane și hoteluri, plachete de onoare și plăcuțe nominale — produse în serie pe un M20 dedicat, cu aceeași precizie de la prima la a suta piesă.",
    typePairing: "Archivo Expanded · IBM Plex Mono",
    heroProductSlug: "breloc-greu-cabana-montana",
    machine: "M20_OLD_GEN_2",
    pillars: [
      {
        icon: "calculator",
        title: "Prețuri de volum",
        body: "Reduceri progresive de la 5 sau 10 bucăți, până la −25% pentru serii de peste 100 de piese.",
      },
      {
        icon: "receipt",
        title: "Facturare pe firmă",
        body: "Comandă ca persoană juridică, cu CUI și număr de Registrul Comerțului pe factură.",
      },
      {
        icon: "factory",
        title: "Mașină dedicată seriilor",
        body: "Un M20 rulează doar comenzi corporate: același fișier, aceeași sculă, piese identice.",
      },
    ],
    collectionTitle: "Catalog Bespoke",
    collectionLead: "Piese pentru recepții, cabane și ceremonii de companie — cu tarife pe tranșe de volum.",
  },
};

export const ATELIER_ORDER: Atelier[] = ["umbrella", ...BRANCHES];

export function isBranch(value: string): value is Branch {
  return (BRANCHES as readonly string[]).includes(value);
}
