import type { SymbolDef } from "@/lib/symbols";

interface SymbolPathsProps {
  symbol: SymbolDef;
  /** Letters set inside a monogram crest. */
  initials?: string;
  fontFamily?: string;
  color?: string;
}

/** The symbol's paths on its 24 × 24 grid, for embedding inside another SVG. */
export function SymbolPaths({ symbol, initials, fontFamily, color = "currentColor" }: SymbolPathsProps) {
  return (
    <>
      {symbol.paths.map((path, index) => (
        <path
          key={index}
          d={path.d}
          transform={path.transform}
          fill={path.fill ? color : "none"}
          stroke={path.fill ? "none" : color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {symbol.monogramSlot && initials && (
        <text
          x={symbol.monogramSlot.x}
          y={symbol.monogramSlot.y}
          dy="0.35em"
          textAnchor="middle"
          fontSize={symbol.monogramSlot.size * (initials.length > 2 ? 0.8 : 1)}
          fill={color}
          style={{ fontFamily }}
        >
          {initials}
        </text>
      )}
    </>
  );
}

export function SymbolGlyph({ symbol, className, ...rest }: SymbolPathsProps & { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <SymbolPaths symbol={symbol} {...rest} />
    </svg>
  );
}
