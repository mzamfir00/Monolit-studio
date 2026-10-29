/** Rose-engine style rosette — the classic engraved-dial pattern, built from rotated circles and ellipses. */
export function Guilloche({ className }: { className?: string }) {
  return (
    <svg viewBox="-200 -200 400 400" aria-hidden="true" className={className}>
      <g fill="none" stroke="currentColor">
        <g strokeWidth={0.5} opacity={0.6}>
          {Array.from({ length: 60 }, (_, i) => {
            const angle = (i * 6 * Math.PI) / 180;
            return <circle key={i} cx={(58 * Math.cos(angle)).toFixed(2)} cy={(58 * Math.sin(angle)).toFixed(2)} r={112} />;
          })}
        </g>
        <g strokeWidth={0.4} opacity={0.45}>
          {Array.from({ length: 36 }, (_, i) => (
            <ellipse key={i} rx={188} ry={62} transform={`rotate(${i * 5})`} />
          ))}
        </g>
        <circle r={197} strokeWidth={1.2} />
        <circle r={191} strokeWidth={0.5} />
        <circle r={56} strokeWidth={0.6} />
      </g>
    </svg>
  );
}
