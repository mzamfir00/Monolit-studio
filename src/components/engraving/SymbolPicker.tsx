"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { cn } from "@/lib/format";
import { SYMBOL_CATEGORIES, SYMBOLS, type SymbolDef } from "@/lib/symbols";
import type { SymbolSet } from "@/lib/types";
import { optionClass } from "./ConfiguratorUI";
import { SymbolGlyph } from "./SymbolGlyph";

function SymbolTile({
  symbol,
  checked,
  onSelect,
  initials,
  fontFamily,
}: {
  symbol: SymbolDef;
  checked: boolean;
  onSelect: (key: string) => void;
  initials?: string;
  fontFamily: string;
}) {
  return (
    <label className={cn(optionClass, "flex-col justify-center gap-2 px-2 py-3 text-center")}>
      <input
        type="radio"
        name="symbol"
        value={symbol.key}
        checked={checked}
        onChange={() => onSelect(symbol.key)}
        className="sr-only"
      />
      <SymbolGlyph symbol={symbol} initials={initials || "AV"} fontFamily={fontFamily} className="size-9 text-ink" />
      <span className="text-[11px] leading-tight text-muted">{symbol.name}</span>
    </label>
  );
}

/** Categorised grid of engraving-ready vector symbols, opening on the product's own library. */
export function SymbolPicker({
  value,
  onChange,
  defaultCategory,
  initials,
  fontFamily,
}: {
  value: string | null;
  onChange: (key: string | null) => void;
  defaultCategory: SymbolSet;
  initials: string;
  fontFamily: string;
}) {
  const selected = SYMBOLS.find((symbol) => symbol.key === value);
  const [category, setCategory] = useState<SymbolSet>(selected?.category ?? defaultCategory);
  const inCategory = SYMBOLS.filter((symbol) => symbol.category === category);
  const main = inCategory.filter((symbol) => !symbol.group);
  const zodiac = inCategory.filter((symbol) => symbol.group === "zodiac");

  return (
    <div className="grid gap-4">
      <div role="group" aria-label="Categorie de simboluri" className="flex flex-wrap gap-2">
        {SYMBOL_CATEGORIES.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={category === option.key}
            onClick={() => setCategory(option.key)}
            className={cn(
              "cfg-tab rounded-full border px-4 py-2 text-sm transition-colors",
              category === option.key
                ? "border-ink bg-ink text-bg"
                : "border-line text-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <label className={cn(optionClass, "flex-col justify-center gap-2 px-2 py-3 text-center")}>
          <input type="radio" name="symbol" value="" checked={!value} onChange={() => onChange(null)} className="sr-only" />
          <Ban className="size-9 text-muted" strokeWidth={1} aria-hidden="true" />
          <span className="text-[11px] leading-tight text-muted">Fără simbol</span>
        </label>
        {main.map((symbol) => (
          <SymbolTile
            key={symbol.key}
            symbol={symbol}
            checked={value === symbol.key}
            onSelect={onChange}
            initials={initials}
            fontFamily={fontFamily}
          />
        ))}
      </div>

      {zodiac.length > 0 && (
        <div className="grid gap-2">
          <p className="eyebrow text-muted">Zodiac</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {zodiac.map((symbol) => (
              <SymbolTile
                key={symbol.key}
                symbol={symbol}
                checked={value === symbol.key}
                onSelect={onChange}
                fontFamily={fontFamily}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
