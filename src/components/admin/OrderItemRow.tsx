import { Download, PenTool } from "lucide-react";
import { SymbolGlyph } from "@/components/engraving/SymbolGlyph";
import { ATELIERS } from "@/lib/branches";
import { getFont, initialsFrom, type FontKey } from "@/lib/engraving";
import { formatMm } from "@/lib/format";
import { specForItem, type AdminOrderItem } from "@/lib/server/admin";
import { getSymbol } from "@/lib/symbols";
import { MachineSelect } from "./MachineSelect";

export function SvgButtons({ item }: { item: AdminOrderItem }) {
  const link =
    "inline-flex items-center gap-1.5 rounded-branch border border-line-strong bg-bg px-2.5 py-1.5 text-xs hover:border-ink";
  return (
    <div className="flex flex-wrap gap-1.5">
      <a href={`/api/admin/svg/${item.id}/fata`} download className={link}>
        <Download className="size-3.5" aria-hidden="true" />
        Descarcă SVG (mm) · Față
      </a>
      {item.engravingSides === "FRONT_AND_BACK" && (
        <a href={`/api/admin/svg/${item.id}/verso`} download className={link}>
          <Download className="size-3.5" aria-hidden="true" />
          Descarcă SVG (mm) · Verso
        </a>
      )}
    </div>
  );
}

function Lines({ label, lines, fontKey }: { label: string; lines: string[]; fontKey: string }) {
  const font = getFont(fontKey as FontKey);
  if (lines.length === 0) return null;
  return (
    <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2 text-sm">
      <span className="pt-0.5 text-xs text-muted">{label}</span>
      <span
        style={{ fontFamily: font.cssFamily, textTransform: font.uppercase ? "uppercase" : undefined }}
        className="leading-snug"
      >
        {lines.map((line, index) => (
          <span key={index} className="block break-words">
            {line || "—"}
          </span>
        ))}
      </span>
    </div>
  );
}

/** One piece in the queue: what to engrave, on which machine, and the Gravostyle files. */
export function OrderItemRow({ item, compact = false }: { item: AdminOrderItem; compact?: boolean }) {
  const spec = specForItem(item);
  const symbol = getSymbol(item.symbolKey);
  const font = getFont(item.fontKey as FontKey);
  return (
    <div className="grid gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <span
            data-branch={item.branch}
            className="eyebrow w-fit rounded-full border border-line bg-bg px-2 py-0.5 text-[10px] text-ink"
          >
            {ATELIERS[item.branch].shortName}
          </span>
          <p className="text-sm font-medium leading-snug">
            {item.productName} <span className="text-muted">× {item.quantity}</span>
          </p>
          <p className="text-xs text-muted">
            {item.variantName} · {item.blankSku}
            {spec && ` · ${formatMm(spec.engraveWidthMm, spec.engraveHeightMm)}`}
          </p>
        </div>
        {symbol && (
          <SymbolGlyph
            symbol={symbol}
            initials={initialsFrom(item.frontLines)}
            fontFamily={font.cssFamily}
            className="size-8 shrink-0 text-ink"
          />
        )}
      </div>
      <div className="grid gap-1.5 rounded-branch bg-surface px-3 py-2">
        <Lines label="Față" lines={item.frontLines} fontKey={item.fontKey} />
        {item.engravingSides === "FRONT_AND_BACK" && <Lines label="Verso" lines={item.backLines} fontKey={item.fontKey} />}
        {!compact && (
          <p className="text-xs text-muted">
            Font: {font.label} ({font.family})
          </p>
        )}
      </div>
      {item.customUploadUrl && (
        <a
          href={`/api/admin/uploads/${item.customUploadUrl}`}
          download
          className="flex items-center gap-1.5 text-xs underline-offset-4 hover:underline"
        >
          <PenTool className="size-3.5 text-metal" aria-hidden="true" />
          Schița clientului: {item.sketchName} — descarcă pentru vectorizare
        </a>
      )}
      {item.giftPackaging && <p className="text-xs text-metal-text">Cutie de catifea + certificat</p>}
      <MachineSelect itemId={item.id} value={item.assignedMachine} recommended={item.product?.recommendedMachine} />
      <SvgButtons item={item} />
    </div>
  );
}
