import type { Metadata } from "next";
import { FilterChip } from "@/components/admin/FilterChip";
import { ProductionCard } from "@/components/admin/ProductionCard";
import { STATION_COLORS } from "@/lib/admin-ui";
import { cn } from "@/lib/format";
import { getProductionQueue, getQueueCounts } from "@/lib/server/admin";
import type { Machine, OrderStatus } from "@/lib/types";
import { MACHINES, MACHINE_ORDER, WORKFLOW_STEPS } from "@/lib/workshop";

export const metadata: Metadata = { title: "Producție M20" };

type Search = Promise<{ masina?: string; status?: string }>;

const isMachine = (value?: string): value is Machine => MACHINE_ORDER.includes(value as Machine);
const isStatus = (value?: string): value is OrderStatus => WORKFLOW_STEPS.some((step) => step.status === value);

export default async function ProductionPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const machine = isMachine(params.masina) ? params.masina : undefined;
  const status = isStatus(params.status) ? params.status : undefined;
  const [orders, counts] = await Promise.all([getProductionQueue({ machine, status }), getQueueCounts()]);

  const href = (next: { masina?: string; status?: string }) => {
    const query = new URLSearchParams();
    const m = "masina" in next ? next.masina : machine;
    const s = "status" in next ? next.status : status;
    if (m) query.set("masina", m);
    if (s) query.set("status", s);
    const search = query.toString();
    return `/admin/production${search ? `?${search}` : ""}`;
  };
  const columns = status ? WORKFLOW_STEPS.filter((step) => step.status === status) : WORKFLOW_STEPS;
  const totalPieces = Object.values(counts.byMachine).reduce((sum, value) => sum + value, 0);

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <p className="eyebrow text-metal-text">Atelier · 3 × Gravograph M20</p>
        <h1 className="display text-h2">Coada de producție</h1>
        <p className="text-muted">
          {totalPieces} {totalPieces === 1 ? "piesă" : "piese"} în lucru. Fiecare piesă e alocată automat mașinii recomandate
          pentru produsul ei; o poți muta pe alt M20 din card.
        </p>
      </header>

      <div className="grid gap-3">
        <div role="group" aria-label="Filtru mașină" className="flex flex-wrap gap-2">
          <FilterChip href={href({ masina: undefined })} active={!machine}>
            Toate mașinile
          </FilterChip>
          {MACHINE_ORDER.map((key) => (
            <FilterChip key={key} href={href({ masina: key })} active={machine === key}>
              {MACHINES[key].shortLabel}
              <span className="font-mono text-xs opacity-70">{counts.byMachine[key]}</span>
            </FilterChip>
          ))}
        </div>
        <div role="group" aria-label="Filtru etapă" className="flex flex-wrap gap-2">
          <FilterChip href={href({ status: undefined })} active={!status}>
            Toate etapele
          </FilterChip>
          {WORKFLOW_STEPS.map((step) => (
            <FilterChip key={step.status} href={href({ status: step.status })} active={status === step.status}>
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", step.status === "SHIPPED" && "bg-current")}
                style={STATION_COLORS[step.status] ? { background: STATION_COLORS[step.status] } : undefined}
              />
              {step.label}
              {step.status !== "SHIPPED" && (
                <span className="font-mono text-xs opacity-70">
                  {counts.byStatus[step.status as keyof typeof counts.byStatus]}
                </span>
              )}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className={cn("pb-4", status ? "" : "-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10")}>
        <div className={cn("grid gap-4", status ? "" : "grid-flow-col auto-cols-[19rem] items-start")}>
          {columns.map((step) => {
            const inColumn = orders.filter((order) => order.status === step.status);
            return (
              <section
                key={step.status}
                aria-labelledby={`col-${step.status}`}
                className="grid content-start gap-3 rounded-branch-lg bg-surface p-3"
              >
                <h2 id={`col-${step.status}`} className="flex items-center justify-between gap-2 px-1 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn("size-2.5 rounded-full", step.status === "SHIPPED" && "bg-ink")}
                      style={STATION_COLORS[step.status] ? { background: STATION_COLORS[step.status] } : undefined}
                    />
                    {step.label}
                  </span>
                  <span className="font-mono text-xs text-muted">{inColumn.length}</span>
                </h2>
                {step.status === "SHIPPED" && <p className="px-1 text-xs text-muted">Ultimele 14 zile</p>}
                <div className={cn("grid gap-3", status && "sm:grid-cols-2 xl:grid-cols-3")}>
                  {inColumn.length === 0 ? (
                    <p className="rounded-branch border border-dashed border-line-strong px-3 py-6 text-center text-xs text-muted">
                      Nicio comandă
                    </p>
                  ) : (
                    inColumn.map((order) => <ProductionCard key={order.id} order={order} machine={machine} />)
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
