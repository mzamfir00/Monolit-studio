import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, Flag, FlaskConical } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BranchMark } from "@/components/shell/BranchMark";
import { BAR_COLOR, STATION_COLORS, formatDay, formatDayTime } from "@/lib/admin-ui";
import { ATELIERS } from "@/lib/branches";
import { cn, formatRon } from "@/lib/format";
import { ACTIVE_STATUSES, customerName, getDashboard } from "@/lib/server/admin";
import { MACHINES, ORDER_STATUS_LABELS } from "@/lib/workshop";

export const metadata: Metadata = { title: "Panou" };

const PERIODS = [
  { key: "30", label: "30 de zile", days: 30 },
  { key: "90", label: "90 de zile", days: 90 },
  { key: "365", label: "12 luni", days: 365 },
  { key: "tot", label: "De la început", days: null },
] as const;

const ronCompact = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 });

function Tile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="grid content-start gap-1 rounded-branch-lg border border-line bg-bg p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
      {detail && <p className="text-xs text-muted">{detail}</p>}
    </div>
  );
}

/** Hover / keyboard-focus readout for a chart mark; the same values are also in the table view. */
function Tip({ children }: { children: ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-branch border border-line bg-bg px-3 py-2 text-xs shadow-lg group-hover:block group-focus-visible:block"
    >
      {children}
    </span>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  table,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  table: ReactNode;
}) {
  return (
    <section className="grid content-start gap-5 rounded-branch-lg border border-line bg-bg p-6">
      <div className="grid gap-1">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      {children}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted hover:text-ink">Vezi ca tabel</summary>
        <div className="mt-3 overflow-x-auto">{table}</div>
      </details>
    </section>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ perioada?: string; test?: string }> }) {
  const params = await searchParams;
  const period = PERIODS.find((candidate) => candidate.key === params.perioada) ?? PERIODS[0];
  const includeTest = params.test !== "0";
  const data = await getDashboard({ days: period.days, includeTest });
  const href = (next: { perioada?: string; test?: string }) => {
    const query = new URLSearchParams({ perioada: next.perioada ?? period.key });
    if ((next.test ?? (includeTest ? "1" : "0")) === "0") query.set("test", "0");
    return `/admin?${query}`;
  };

  const maxBranch = Math.max(1, ...data.byBranch.map((row) => row.revenueBani));
  const branchTotal = data.byBranch.reduce((sum, row) => sum + row.revenueBani, 0);
  const maxMachine = Math.max(1, ...data.machines.map((row) => row.pieces));

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <p className="eyebrow text-metal-text">Panou de control</p>
          <h1 className="display text-h2">Atelierul azi</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtre">
          {PERIODS.map((option) => (
            <Link
              key={option.key}
              href={href({ perioada: option.key })}
              aria-current={option.key === period.key ? "true" : undefined}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm",
                option.key === period.key ? "border-ink bg-ink text-bg" : "border-line bg-bg text-muted hover:text-ink",
              )}
            >
              {option.label}
            </Link>
          ))}
          <Link
            href={href({ test: includeTest ? "0" : "1" })}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3.5 py-1.5 text-sm text-muted hover:text-ink"
          >
            <FlaskConical className="size-3.5" aria-hidden="true" />
            {includeTest ? "Exclude comenzile de test" : "Include comenzile de test"}
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="grid content-start gap-1 rounded-branch-lg border border-line bg-accent p-5 text-accent-ink">
          <p className="text-sm opacity-80">Încasări · {period.label.toLowerCase()}</p>
          <p className="text-5xl font-semibold">{formatRon(data.totals.revenueBani)}</p>
          <p className="text-xs opacity-75">
            {includeTest && data.totals.testOrders > 0 ? `din care ${data.totals.testOrders} comenzi de test · ` : ""}cu livrare
            inclusă
          </p>
        </div>
        <Tile label="Comenzi plătite" value={String(data.totals.orders)} />
        <Tile label="Valoare medie" value={formatRon(data.totals.averageBani)} />
        <Tile
          label="În producție acum"
          value={`${data.totals.piecesInProduction} piese`}
          detail={`${data.totals.ordersInProduction} ${data.totals.ordersInProduction === 1 ? "comandă" : "comenzi"}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Încasări pe atelier"
          subtitle={`Valoarea pieselor plătite, fără livrare · ${period.label.toLowerCase()}`}
          table={
            <table className="w-full text-left">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1.5 font-medium">Atelier</th>
                  <th className="py-1.5 text-right font-medium">Încasări</th>
                  <th className="py-1.5 text-right font-medium">Piese</th>
                  <th className="py-1.5 text-right font-medium">Pondere</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {data.byBranch.map((row) => (
                  <tr key={row.branch} className="border-t border-line">
                    <td className="py-1.5">{ATELIERS[row.branch].name}</td>
                    <td className="py-1.5 text-right">{formatRon(row.revenueBani)}</td>
                    <td className="py-1.5 text-right">{row.pieces}</td>
                    <td className="py-1.5 text-right">{branchTotal ? Math.round((row.revenueBani / branchTotal) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <ul className="grid gap-4">
            {data.byBranch.map((row) => {
              const share = branchTotal ? Math.round((row.revenueBani / branchTotal) * 100) : 0;
              return (
                <li key={row.branch} className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <BranchMark atelier={row.branch} className="size-4 text-muted" />
                      {ATELIERS[row.branch].name}
                    </span>
                    <span className="text-xs text-muted">
                      {row.pieces} piese · {share}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 flex-1">
                      {row.revenueBani > 0 && (
                        <span
                          tabIndex={0}
                          aria-label={`${ATELIERS[row.branch].name}: ${formatRon(row.revenueBani)}`}
                          className="group relative block h-full rounded-r-[4px] outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ink"
                          style={{ width: `${(row.revenueBani / maxBranch) * 100}%`, background: BAR_COLOR }}
                        >
                          <Tip>
                            <strong className="block text-sm">{formatRon(row.revenueBani)}</strong>
                            {ATELIERS[row.branch].name} · {row.pieces} piese
                          </Tip>
                        </span>
                      )}
                    </div>
                    <span className="w-28 shrink-0 text-right text-sm tabular-nums">
                      {row.revenueBani > 0 ? `${ronCompact.format(row.revenueBani / 100)} RON` : "—"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </ChartCard>

        <ChartCard
          title="Încărcarea celor trei M20"
          subtitle="Piese în lucru pe fiecare mașină, pe etape — comenzi plătite, încă neexpediate"
          table={
            <table className="w-full text-left">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1.5 font-medium">Mașină</th>
                  {ACTIVE_STATUSES.map((status) => (
                    <th key={status} className="py-1.5 text-right font-medium">
                      {ORDER_STATUS_LABELS[status]}
                    </th>
                  ))}
                  <th className="py-1.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {data.machines.map((row) => (
                  <tr key={row.machine} className="border-t border-line">
                    <td className="py-1.5">{MACHINES[row.machine].shortLabel}</td>
                    {ACTIVE_STATUSES.map((status) => (
                      <td key={status} className="py-1.5 text-right">
                        {row.byStatus[status]}
                      </td>
                    ))}
                    <td className="py-1.5 text-right font-semibold">{row.pieces}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <ul aria-label="Legendă" className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
            {ACTIVE_STATUSES.map((status) => (
              <li key={status} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2.5 w-3.5 rounded-[2px]" style={{ background: STATION_COLORS[status] }} />
                {ORDER_STATUS_LABELS[status]}
              </li>
            ))}
          </ul>
          <ul className="grid gap-4">
            {data.machines.map((row) => (
              <li key={row.machine} className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <Link href={`/admin/production?masina=${row.machine}`} className="hover:underline">
                    {MACHINES[row.machine].label}
                  </Link>
                  <span className="text-xs text-muted">{MACHINES[row.machine].role}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 flex-1">
                    <div className="flex h-full gap-[2px]" style={{ width: `${(row.pieces / maxMachine) * 100}%` }}>
                      {ACTIVE_STATUSES.filter((status) => row.byStatus[status] > 0).map((status, index, visible) => (
                        <span
                          key={status}
                          tabIndex={0}
                          aria-label={`${MACHINES[row.machine].shortLabel}, ${ORDER_STATUS_LABELS[status]}: ${row.byStatus[status]} piese`}
                          className={cn(
                            "group relative block h-full outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ink",
                            index === visible.length - 1 && "rounded-r-[4px]",
                          )}
                          style={{ flexGrow: row.byStatus[status], flexBasis: 0, background: STATION_COLORS[status] }}
                        >
                          <Tip>
                            <strong className="block text-sm">{row.byStatus[status]} piese</strong>
                            {ORDER_STATUS_LABELS[status]} · {MACHINES[row.machine].shortLabel}
                          </Tip>
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="w-28 shrink-0 text-right text-sm tabular-nums">
                    {row.pieces > 0 ? `${row.pieces} ${row.pieces === 1 ? "piesă" : "piese"}` : "liberă"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="grid content-start gap-4 rounded-branch-lg border border-line bg-bg p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Flag className="size-4 text-metal-text" aria-hidden="true" />
            Urgente și termene apropiate
          </h2>
          {data.urgent.length === 0 ? (
            <p className="text-sm text-muted">Nicio comandă urgentă. Toate termenele sunt în grafic.</p>
          ) : (
            <ul className="grid divide-y divide-line">
              {data.urgent.map(({ order, due }) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="grid gap-0.5">
                    <Link href={`/admin/orders/${order.number}`} className="font-mono text-sm font-semibold hover:underline">
                      {order.number}
                    </Link>
                    <span className="text-xs text-muted">
                      {customerName(order)}
                      {order.isUrgent && " · marcată urgentă"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    {due && (
                      <span
                        className={cn("text-xs", due.getTime() < Date.now() ? "font-semibold text-metal-text" : "text-muted")}
                      >
                        {due.getTime() < Date.now() ? "Întârziată · " : "Termen "}
                        {formatDay(due)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid content-start gap-4 rounded-branch-lg border border-line bg-bg p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="size-4 text-metal-text" aria-hidden="true" />
            Stoc de semifabricate
          </h2>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-muted">Toate semifabricatele sunt peste pragul de alertă.</p>
          ) : (
            <ul className="grid divide-y divide-line">
              {data.lowStock.map((product) => (
                <li key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    {product.stockQuantity <= 0 ? "Stoc epuizat: " : `Mai ai doar ${product.stockQuantity} × `}
                    <Link href={`/admin/products/${product.id}`} className="font-medium hover:underline">
                      {product.name}
                    </Link>
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {product.blankSku} · prag {product.lowStockThreshold}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="grid gap-4 rounded-branch-lg border border-line bg-bg p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold">Ultimele comenzi</h2>
          <Link href="/admin/orders" className="text-sm text-muted hover:text-ink">
            Toate comenzile →
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <p className="text-sm text-muted">Încă nu există comenzi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <tbody className="divide-y divide-line">
                {data.recent.map((order) => (
                  <tr key={order.number}>
                    <td className="py-2.5 pr-4">
                      <Link href={`/admin/orders/${order.number}`} className="font-mono font-semibold hover:underline">
                        {order.number}
                      </Link>
                      {order.isSimulated && (
                        <FlaskConical className="ml-2 inline size-3.5 text-muted" aria-label="Comandă de test" />
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-muted tabular-nums">{formatDayTime(order.createdAt)}</td>
                    <td className="py-2.5 pr-4">{customerName(order)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{formatRon(order.totalBani)}</td>
                    <td className="py-2.5 text-right">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
