import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, Search } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDayTime } from "@/lib/admin-ui";
import { ATELIERS } from "@/lib/branches";
import { formatRon } from "@/lib/format";
import { customerName, listOrders } from "@/lib/server/admin";
import type { Branch, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/workshop";

export const metadata: Metadata = { title: "Comenzi" };

const FILTERS: OrderStatus[] = [
  "PAID_NEW",
  "ASSIGNED_TO_M20",
  "ENGRAVING",
  "FINISHING_ULTRASONIC",
  "PACKAGING",
  "SHIPPED",
  "CANCELLED",
  "PENDING_PAYMENT",
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams;
  const status = FILTERS.includes(params.status as OrderStatus) ? (params.status as OrderStatus) : undefined;
  const orders = await listOrders({ status, q: params.q });

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <p className="eyebrow text-metal-text">Clienți · facturare · AWB</p>
        <h1 className="display text-h2">Comenzi</h1>
      </header>

      <form className="flex flex-wrap items-end gap-3" role="search">
        <label className="grid gap-1 text-sm">
          Caută
          <span className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Număr, nume, firmă, e-mail sau AWB"
              className="h-10 w-80 max-w-full rounded-branch border border-line-strong bg-bg pl-9 pr-3"
            />
          </span>
        </label>
        <label className="grid gap-1 text-sm">
          Etapă
          <select name="status" defaultValue={status ?? ""} className="h-10 rounded-branch border border-line-strong bg-bg px-3">
            <option value="">Toate (fără neplătite)</option>
            {FILTERS.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-ghost min-h-10">
          Filtrează
        </button>
      </form>

      <div className="overflow-x-auto rounded-branch-lg border border-line bg-bg">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs text-muted">
            <tr>
              {["Comandă", "Plasată", "Client", "Ateliere", "Piese", "Total", "Etapă"].map((heading) => (
                <th key={heading} scope="col" className="px-4 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Nicio comandă pentru acest filtru.
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const branches = [...new Set(order.items.map((item) => item.branch))] as Branch[];
              return (
                <tr key={order.id} className="hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.number}`} className="font-mono font-semibold hover:underline">
                      {order.number}
                    </Link>
                    {order.isSimulated && (
                      <FlaskConical className="ml-2 inline size-3.5 text-muted" aria-label="Comandă de test" />
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted">{formatDayTime(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    {customerName(order)}
                    <span className="ml-2 text-xs text-muted">{order.customerType === "COMPANY" ? "PJ" : "PF"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      {branches.map((branch) => (
                        <span
                          key={branch}
                          data-branch={branch}
                          className="eyebrow rounded-full border border-line bg-bg px-2 py-0.5 text-[10px] text-ink"
                        >
                          {ATELIERS[branch].shortName}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatRon(order.totalBani)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
