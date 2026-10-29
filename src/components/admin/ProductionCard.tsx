import Link from "next/link";
import { Flag, FlaskConical } from "lucide-react";
import { formatDay } from "@/lib/admin-ui";
import { cn } from "@/lib/format";
import { customerName, dueDate, type AdminOrder } from "@/lib/server/admin";
import type { Machine } from "@/lib/types";
import { JobSheet } from "./JobSheet";
import { JobSheetDialog } from "./JobSheetDialog";
import { OrderControls } from "./OrderControls";
import { OrderItemRow } from "./OrderItemRow";

/** One order in the queue. With a machine filter, only that machine's pieces are expanded. */
export function ProductionCard({ order, machine }: { order: AdminOrder; machine?: Machine }) {
  // Shipped pieces are done: a one-line summary keeps the column short.
  const shipped = order.status === "SHIPPED";
  const due = dueDate(order);
  const overdue = due && !shipped && due.getTime() < Date.now();
  const items = machine ? order.items.filter((item) => item.assignedMachine === machine) : order.items;
  const hidden = order.items.length - items.length;
  return (
    <article
      className={cn("grid gap-4 rounded-branch-lg border bg-bg p-4 shadow-sm", order.isUrgent ? "border-metal" : "border-line")}
    >
      <header className="grid gap-1">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/admin/orders/${order.number}`} className="font-mono text-sm font-semibold hover:underline">
            {order.number}
          </Link>
          <div className="flex items-center gap-1.5">
            {order.isSimulated && <FlaskConical className="size-3.5 text-muted" aria-label="Comandă de test" />}
            {order.isUrgent && <Flag className="size-3.5 text-metal-text" aria-label="Urgentă" />}
          </div>
        </div>
        <p className="truncate text-sm">{customerName(order)}</p>
        {due && (
          <p className={cn("text-xs", overdue ? "font-semibold text-metal-text" : "text-muted")}>
            {shipped
              ? `Expediată ${order.shippedAt ? formatDay(order.shippedAt) : ""} · ${order.courierName ?? ""} ${order.awbNumber ?? ""}`
              : `${overdue ? "Întârziată · termen" : "Termen"} ${formatDay(due)}`}
          </p>
        )}
      </header>

      {shipped ? (
        <ul className="grid gap-1 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="truncate">{item.productName}</span>
              <span className="shrink-0 font-mono text-xs text-muted">× {item.quantity}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-4 divide-y divide-line">
          {items.map((item) => (
            <div key={item.id} className="pt-4 first:pt-0">
              <OrderItemRow item={item} compact />
            </div>
          ))}
        </div>
      )}
      {hidden > 0 && (
        <p className="text-xs text-muted">
          + {hidden} {hidden === 1 ? "piesă" : "piese"} pe alte mașini
        </p>
      )}

      <footer className="grid gap-3 border-t border-line pt-3">
        <OrderControls orderId={order.id} status={order.status} isUrgent={order.isUrgent} />
        {!shipped && (
          <JobSheetDialog orderNumber={order.number}>
            <JobSheet order={order} />
          </JobSheetDialog>
        )}
      </footer>
    </article>
  );
}
