import type { EngravingMethod } from "@/lib/types";
import { ENGRAVING_METHODS } from "@/lib/workshop";

/** Exaggerated cross-section of the two M20 techniques: depth, tool and how the metal reacts. */
export function EngravingDiagram({ method, className }: { method: EngravingMethod; className?: string }) {
  const diamond = method === "DIAMOND_DRAG";
  const marker = `arrow-${method}`;
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label={ENGRAVING_METHODS[method].label} className={className}>
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10Z" fill="currentColor" />
        </marker>
      </defs>

      <rect x="8" y="124" width="226" height="60" fill="url(#mg-brass)" />
      <line x1="8" y1="124" x2="234" y2="124" stroke="rgba(255,255,255,0.55)" />

      {/* Tool and groove artwork is drawn around x=160 and shifted onto the block's centre. */}
      <g transform="translate(-40 0)">
        {diamond ? (
          <>
            <path d="M128 124 160 133 192 124Z" fill="rgba(60,40,10,0.45)" />
            <path d="M128 124 160 133M192 124 160 133" stroke="#fff8e6" strokeWidth={1.4} />
            <rect x="150" y="18" width="20" height="74" rx="2" fill="url(#mg-steel)" />
            <path d="M148 92h24l-12 36Z" fill="#eaf4fb" stroke="#8fa4b3" strokeWidth={1} strokeLinejoin="round" />
            <path d="M154 96l6 26M166 96l-6 26" stroke="#b8cad6" strokeWidth={0.8} />
            <path d="M64 108h56" stroke="currentColor" strokeWidth={1.2} markerEnd={`url(#${marker})`} />
            <text x="64" y="100" fontSize="10" fill="currentColor" style={{ fontFamily: "var(--b-font-mono)" }}>
              tragere
            </text>
            {[
              [206, 112],
              [116, 116],
            ].map(([x, y]) => (
              <path
                key={x}
                d={`M${x} ${y - 7}v14M${x - 7} ${y}h14M${x - 3.5} ${y - 3.5}l7 7M${x + 3.5} ${y - 3.5}l-7 7`}
                stroke="var(--b-metal)"
                strokeWidth={0.9}
              />
            ))}
          </>
        ) : (
          <>
            <path d="M132 124 138 160h44l6-36Z" fill="rgba(50,32,8,0.55)" />
            <rect x="146" y="8" width="28" height="58" rx="3" fill="url(#mg-steel)" />
            <rect x="150" y="66" width="20" height="92" fill="#8e959c" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <path key={i} d={`M150 ${76 + i * 12}l20 -9`} stroke="#5b6168" strokeWidth={1.6} />
            ))}
            <path
              d="M126 38a34 10 0 1 0 68 0"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.2}
              markerEnd={`url(#${marker})`}
            />
            <text x="200" y="34" fontSize="10" fill="currentColor" style={{ fontFamily: "var(--b-font-mono)" }}>
              rotație
            </text>
            {["M118 116c-6-8 2-16 8-10s-4 10-6 4", "M198 110c6-8 14-2 9 5s-9 0-5-4", "M108 100c-4-6 3-10 6-6"].map((d) => (
              <path key={d} d={d} fill="none" stroke="#c9a25c" strokeWidth={1.6} strokeLinecap="round" />
            ))}
          </>
        )}
      </g>

      <g stroke="currentColor" strokeWidth={0.8} fill="currentColor" style={{ fontFamily: "var(--b-font-mono)" }}>
        <path d={diamond ? "M244 124v9" : "M244 124v36"} />
        <path d={diamond ? "M240 124h8M240 133h8" : "M240 124h8M240 160h8"} />
        <path d={diamond ? "M152 133h88" : "M142 160h98"} strokeDasharray="2 2" />
        <text x="254" y={diamond ? 132 : 146} fontSize="10" stroke="none">
          {diamond ? "≈ 0,05 mm" : "0,20–0,40"}
        </text>
        {!diamond && (
          <text x="254" y="158" fontSize="10" stroke="none">
            mm
          </text>
        )}
      </g>
    </svg>
  );
}
