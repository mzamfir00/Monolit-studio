import type { ReactNode } from "react";
import { SymbolGlyph } from "@/components/engraving/SymbolGlyph";
import { formatDay, formatDayTime } from "@/lib/admin-ui";
import { getFont, initialsFrom, type FontKey } from "@/lib/engraving";
import { formatGrams, formatMm } from "@/lib/format";
import { customerName, dueDate, specForItem, type AdminOrder } from "@/lib/server/admin";
import { getSymbol } from "@/lib/symbols";
import { ENGRAVING_METHODS, MACHINES, MATERIAL_LABELS } from "@/lib/workshop";

const CHECKLIST = [
  "Semifabricat verificat",
  "Fixat în dispozitiv",
  "Gravat față",
  "Gravat verso",
  "Ultrasunete",
  "Lustruire",
  "Control sub lupă",
  "Ambalat",
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-0.5">
      <dt className="eyebrow text-[10px] text-muted">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/**
 * Printable "Fișă Tehnică de Atelier": per piece the machine, blank, dimensions, tooling, exact text,
 * symbol, sketch and packaging — everything the operator needs at the M20 without opening the order.
 */
export function JobSheet({ order }: { order: AdminOrder }) {
  const due = dueDate(order);
  return (
    <article className="grid gap-6 text-ink">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-4">
        <div className="grid gap-1">
          <p className="eyebrow text-muted">Fișă tehnică de atelier · Maison Gravure</p>
          <h2 className="font-mono text-2xl font-semibold">{order.number}</h2>
          <p className="text-sm">
            {customerName(order)} · livrare {order.shippingCity}, jud. {order.shippingCounty}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-right">
          <Field label="Plătită">{order.paidAt ? formatDayTime(order.paidAt) : "—"}</Field>
          <Field label="Termen">{due ? formatDay(due) : "—"}</Field>
          {order.isUrgent && <Field label="Prioritate">URGENTĂ</Field>}
          {order.isSimulated && <Field label="Tip">Comandă de test</Field>}
        </dl>
      </header>

      {order.items.map((item, index) => {
        const spec = specForItem(item);
        const font = getFont(item.fontKey as FontKey);
        const symbol = getSymbol(item.symbolKey);
        const method = spec ? ENGRAVING_METHODS[spec.engravingMethod] : null;
        const textStyle = { fontFamily: font.cssFamily, textTransform: font.uppercase ? ("uppercase" as const) : undefined };
        return (
          <section key={item.id} className="grid gap-4 break-inside-avoid rounded-branch border border-line-strong p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold">
                {index + 1}. {item.productName} <span className="font-normal">× {item.quantity}</span>
              </h3>
              <p className="rounded-branch border-2 border-ink px-3 py-1 font-mono text-sm font-semibold">
                {item.assignedMachine ? MACHINES[item.assignedMachine].label : "MAȘINĂ NEALOCATĂ"}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Cod semifabricat">
                <span className="font-mono">{item.blankSku}</span>
              </Field>
              <Field label="Finisaj">{item.variantName}</Field>
              <Field label="Material">{spec ? MATERIAL_LABELS[spec.material] : "—"}</Field>
              <Field label="Dimensiuni piesă">
                {spec ? `${formatMm(spec.widthMm, spec.heightMm, spec.depthMm)} · ${formatGrams(spec.weightGrams)}` : "—"}
              </Field>
              <Field label="Zonă de gravură">{spec ? formatMm(spec.engraveWidthMm, spec.engraveHeightMm) : "—"}</Field>
              <Field label="Tehnică">{method?.label ?? "—"}</Field>
              <Field label="Adâncime">{spec ? formatMm(spec.engraveDepthMm) : "—"}</Field>
              <Field label="Font">
                {font.label} · {font.family}
              </Field>
            </dl>
            {spec && (
              <p className="rounded-branch bg-surface px-3 py-2 text-sm">
                <span className="eyebrow mr-2 text-[10px] text-muted">Sculă</span>
                {spec.toolRecommendation}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {(["front", "back"] as const).map((side) => {
                const lines = side === "front" ? item.frontLines : item.backLines;
                if (side === "back" && item.engravingSides !== "FRONT_AND_BACK") return null;
                return (
                  <div key={side} className="grid content-start gap-2">
                    <p className="eyebrow text-[10px] text-muted">{side === "front" ? "Față" : "Verso"}</p>
                    <div className="grid gap-1 rounded-branch border border-line px-3 py-2 text-xl" style={textStyle}>
                      {lines.length > 0 ? (
                        lines.map((line, i) => <span key={i}>{line || " "}</span>)
                      ) : (
                        <span className="font-sans text-sm text-muted">Fără text</span>
                      )}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element -- generated, authenticated SVG */}
                    <img
                      src={`/api/admin/svg/${item.id}/${side === "front" ? "fata" : "verso"}`}
                      alt={`Fișierul SVG pentru ${side === "front" ? "față" : "verso"}`}
                      className="max-h-40 w-full rounded-branch border border-dashed border-line bg-white object-contain p-2"
                    />
                  </div>
                );
              })}
            </div>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Simbol">
                {symbol ? (
                  <span className="flex items-center gap-2">
                    <SymbolGlyph
                      symbol={symbol}
                      initials={initialsFrom(item.frontLines)}
                      fontFamily={font.cssFamily}
                      className="size-8"
                    />
                    {symbol.name}
                  </span>
                ) : (
                  "—"
                )}
              </Field>
              <Field label="Schiță client">{item.sketchName ? `${item.sketchName} — de vectorizat` : "—"}</Field>
              <Field label="Ambalaj">
                {item.giftPackaging ? "Cutie rigidă cu catifea + Certificat de Gravură Mecanică" : "Ambalaj standard"}
              </Field>
            </dl>

            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3 text-sm">
              {CHECKLIST.filter((step) => step !== "Gravat verso" || item.engravingSides === "FRONT_AND_BACK").map((step) => (
                <li key={step} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block size-3.5 border border-ink" />
                  {step}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {order.customerNote && (
        <section className="rounded-branch border border-line-strong p-4">
          <p className="eyebrow text-[10px] text-muted">Mențiunile clientului</p>
          <p className="text-sm">{order.customerNote}</p>
        </section>
      )}
    </article>
  );
}
