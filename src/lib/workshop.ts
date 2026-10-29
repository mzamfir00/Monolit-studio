import type { Branch, EngravingMethod, Machine, Material } from "./types";

export const MATERIAL_LABELS: Record<Material, string> = {
  BRASS: "Alamă masivă",
  STAINLESS_316L: "Inox chirurgical 316L",
  SILVER_925: "Argint 925",
  TITANIUM: "Titan Grad 5",
  LEATHER: "Piele",
  WOOD: "Lemn masiv",
  CERAMIC: "Ceramică",
};

export interface MachineInfo {
  key: Machine;
  label: string;
  shortLabel: string;
  role: string;
  description: string;
  /** Branch whose orders are auto-suggested onto this machine in the production queue. */
  suggestedFor: Branch[];
}

export const MACHINES: Record<Machine, MachineInfo> = {
  M20_NEW_GEN: {
    key: "M20_NEW_GEN",
    label: "Gravograph M20 · Generația nouă",
    shortLabel: "M20 Gen. nouă",
    role: "Micro-gravură de bijuterie",
    description:
      "Cea mai nouă mașină din atelier, rezervată argintului 925, butonilor și bănuților de botez — acolo unde o linie de diamant trebuie să fie perfect egală pe o suprafață de câțiva milimetri.",
    suggestedFor: ["jewelry"],
  },
  M20_OLD_GEN_1: {
    key: "M20_OLD_GEN_1",
    label: "Gravograph M20 · Generația anterioară #1",
    shortLabel: "M20 #1",
    role: "Alamă grea & inox",
    description:
      "Calul de povară al atelierului: medalioane de 3 mm, brichete de alamă, ploști și port-carduri din titan. Aici se frezează adânc și se gravează cu diamantul pe metale dure.",
    suggestedFor: ["pet", "vault"],
  },
  M20_OLD_GEN_2: {
    key: "M20_OLD_GEN_2",
    label: "Gravograph M20 · Generația anterioară #2",
    shortLabel: "M20 #2",
    role: "Serii corporate & rezervă",
    description:
      "Dedicată seriilor: zeci de brelocuri de cabană sau plachete identice, rulate cu același fișier și aceeași sculă. Preia și comenzile urgente când celelalte două sunt ocupate.",
    suggestedFor: ["corporate"],
  },
};

export const MACHINE_ORDER: Machine[] = ["M20_NEW_GEN", "M20_OLD_GEN_1", "M20_OLD_GEN_2"];

export interface MethodInfo {
  key: EngravingMethod;
  label: string;
  shortLabel: string;
  summary: string;
  depthNote: string;
}

export const ENGRAVING_METHODS: Record<EngravingMethod, MethodInfo> = {
  DIAMOND_DRAG: {
    key: "DIAMOND_DRAG",
    label: "Gravură cu diamant prin tragere",
    shortLabel: "Diamant",
    summary:
      "Un vârf de diamant, apăsat cu o presiune calibrată, comprimă metalul fără să îndepărteze material. Rezultă o linie fină și strălucitoare, care prinde lumina — un efect pe care laserul nu îl poate reproduce.",
    depthNote: "≈ 0,03–0,05 mm, linie lucioasă",
  },
  ROTARY_MILLING: {
    key: "ROTARY_MILLING",
    label: "Frezare rotativă adâncă",
    shortLabel: "Frezare rotativă",
    summary:
      "O freză din carbură, la turație înaltă, sculptează un canal real în metal. Gravura se simte sub deget, rezistă frecării zilnice și poate fi umplută cu vopsea sau patinată.",
    depthNote: "0,20–0,40 mm, canal tactil",
  },
};

/** Production workflow shown to customers on the umbrella page and used by the admin queue. */
export const WORKFLOW_STEPS = [
  {
    status: "PAID_NEW",
    label: "Plătită — Nouă",
    detail: "Plata cu cardul e confirmată de Stripe; comanda intră în coada atelierului.",
  },
  {
    status: "ASSIGNED_TO_M20",
    label: "Alocată pe mașină",
    detail: "Fiecare piesă primește M20-ul potrivit metalului și tehnicii.",
  },
  {
    status: "ENGRAVING",
    label: "În gravare",
    detail: "Fișierul vectorial, la milimetru, rulează pe semifabricatul fixat în menghină.",
  },
  {
    status: "FINISHING_ULTRASONIC",
    label: "Ultrasunete & lustruire",
    detail: "Baia cu ultrasunete scoate orice urmă de așchie; urmează lustruirea manuală.",
  },
  { status: "PACKAGING", label: "Ambalare premium", detail: "Verificare finală sub lupă, apoi cutia de atelier." },
  { status: "SHIPPED", label: "Expediată + AWB", detail: "Primești pe e-mail numărul AWB și curierul." },
] as const;
