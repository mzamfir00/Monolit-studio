import { STATION_COLORS } from "@/lib/admin-ui";
import { cn } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/workshop";

/** Station label with its ramp swatch beside it (the text stays in ink, never in the swatch colour). */
export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const color = STATION_COLORS[status];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-2.5 py-0.5 text-xs", className)}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 rounded-full", !color && (status === "SHIPPED" ? "bg-ink" : "border border-line-strong"))}
        style={color ? { background: color } : undefined}
      />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
