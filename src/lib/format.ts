const ronWhole = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const ronCents = new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", minimumFractionDigits: 2 });

const mmFormatter = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 2 });

/** 18900 → "189 RON", 11868 → "118,68 RON" */
export function formatRon(bani: number): string {
  return (bani % 100 === 0 ? ronWhole : ronCents).format(bani / 100);
}

/** 1.2 → "1,2" */
export function formatNumber(value: number): string {
  return mmFormatter.format(value);
}

/** (30, 34.6) → "30 × 34,6 mm" */
export function formatMm(...values: number[]): string {
  return `${values.map(formatNumber).join(" × ")} mm`;
}

export function formatGrams(grams: number): string {
  return grams >= 1000 ? `${formatNumber(grams / 1000)} kg` : `${formatNumber(grams)} g`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
