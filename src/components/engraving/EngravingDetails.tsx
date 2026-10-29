import type { ReactNode } from "react";
import { Gift, PenTool } from "lucide-react";
import { getFont, initialsFrom, type EngravingConfig } from "@/lib/engraving";
import { getSymbol } from "@/lib/symbols";
import { SymbolGlyph } from "./SymbolGlyph";

function EngravedLines({ lines, config }: { lines: string[]; config: EngravingConfig }) {
  const font = getFont(config.fontKey);
  return (
    <span
      className="grid gap-0.5 rounded-branch border border-line bg-surface px-3 py-2 text-base leading-snug"
      style={{ fontFamily: font.cssFamily, textTransform: font.uppercase ? "uppercase" : undefined }}
    >
      {lines.map((line, index) => (
        <span key={index} className="min-h-5 break-words">
          {line || <span className="font-sans text-xs text-muted">(rând gol)</span>}
        </span>
      ))}
    </span>
  );
}

function ConfigRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="pt-0.5 text-muted">{term}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

/** The full engraving brief for one cart line — what the workshop will cut. */
export function EngravingDetails({ config }: { config: EngravingConfig }) {
  const font = getFont(config.fontKey);
  const symbol = getSymbol(config.symbolKey);
  return (
    <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
      <ConfigRow term="Finisaj">{config.variantName}</ConfigRow>
      <ConfigRow term="Gravură">{config.sides === "FRONT_AND_BACK" ? "Față + verso" : "Doar față"}</ConfigRow>
      <ConfigRow term="Font">
        <span style={{ fontFamily: font.cssFamily }} className="text-base">
          {font.label}
        </span>
      </ConfigRow>
      <ConfigRow term="Față">
        {config.frontLines.length > 0 ? (
          <EngravedLines lines={config.frontLines} config={config} />
        ) : (
          <span className="text-muted">Fără text</span>
        )}
      </ConfigRow>
      {config.sides === "FRONT_AND_BACK" && (
        <ConfigRow term="Verso">
          <EngravedLines lines={config.backLines} config={config} />
        </ConfigRow>
      )}
      {symbol && (
        <ConfigRow term="Simbol">
          <span className="flex items-center gap-2">
            <SymbolGlyph
              symbol={symbol}
              initials={initialsFrom(config.frontLines)}
              fontFamily={font.cssFamily}
              className="size-6 shrink-0 text-ink"
            />
            {symbol.name}
          </span>
        </ConfigRow>
      )}
      {config.sketch && (
        <ConfigRow term="Schiță">
          <span className="flex items-center gap-2">
            <PenTool className="size-4 shrink-0 text-metal" aria-hidden="true" />
            <span className="truncate">{config.sketch.name}</span>
          </span>
        </ConfigRow>
      )}
      {config.giftPackaging && (
        <ConfigRow term="Ambalaj">
          <span className="flex items-center gap-2">
            <Gift className="size-4 shrink-0 text-metal" aria-hidden="true" />
            Cutie de catifea + certificat
          </span>
        </ConfigRow>
      )}
    </dl>
  );
}
