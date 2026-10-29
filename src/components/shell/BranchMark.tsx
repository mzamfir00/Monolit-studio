import type { Atelier } from "@/lib/types";

/** Small geometric emblem for each atelier, drawn in currentColor. */
export function BranchMark({ atelier, className }: { atelier: Atelier; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.2 } as const;
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      {atelier === "umbrella" && (
        <>
          <circle cx="16" cy="16" r="14.5" {...common} />
          <circle cx="16" cy="16" r="11" {...common} strokeDasharray="1 2" />
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse
              key={i}
              cx="16"
              cy="16"
              rx="7.5"
              ry="3"
              {...common}
              strokeWidth={0.8}
              transform={`rotate(${i * 30} 16 16)`}
            />
          ))}
        </>
      )}
      {atelier === "pet" && (
        <>
          <polygon points="16,2.5 27.7,9.25 27.7,22.75 16,29.5 4.3,22.75 4.3,9.25" {...common} strokeLinejoin="round" />
          <circle cx="16" cy="7.5" r="1.6" {...common} />
          <path d="M11 18.5c0-2.2 2.2-3.5 5-3.5s5 1.3 5 3.5-2.2 3.5-5 3.5-5-1.3-5-3.5Z" fill="currentColor" />
          <circle cx="10.5" cy="13.5" r="1.4" fill="currentColor" />
          <circle cx="14" cy="11.5" r="1.4" fill="currentColor" />
          <circle cx="18" cy="11.5" r="1.4" fill="currentColor" />
          <circle cx="21.5" cy="13.5" r="1.4" fill="currentColor" />
        </>
      )}
      {atelier === "jewelry" && (
        <>
          <path d="M16 3 28 13 16 29 4 13Z" {...common} strokeLinejoin="round" />
          <path d="M4 13h24M10 13l6-10 6 10M10 13l6 16 6-16" {...common} strokeWidth={0.8} />
        </>
      )}
      {atelier === "vault" && (
        <>
          <rect x="3" y="3" width="26" height="26" rx="2" {...common} />
          <circle cx="16" cy="16" r="7" {...common} />
          <path d="M16 6v6M16 20v6M6 16h6M20 16h6" {...common} />
          <circle cx="16" cy="16" r="1.4" fill="currentColor" />
        </>
      )}
      {atelier === "corporate" && (
        <>
          <rect x="3" y="3" width="26" height="26" {...common} />
          <path d="M3 12h26M12 12v17M20.5 12v17" {...common} strokeWidth={0.8} />
          <rect x="6" y="6" width="20" height="3" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
