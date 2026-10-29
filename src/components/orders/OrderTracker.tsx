import { Check, Truck } from "lucide-react";
import { cn } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { WORKFLOW_STEPS } from "@/lib/workshop";

const when = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});

export interface TrackerEvent {
  status: OrderStatus;
  createdAt: Date;
}

/** Six workshop stations, from payment to AWB, with the time each one was reached. */
export function OrderTracker({
  status,
  events,
  courierName,
  awbNumber,
}: {
  status: OrderStatus;
  events: TrackerEvent[];
  courierName: string | null;
  awbNumber: string | null;
}) {
  const current = WORKFLOW_STEPS.findIndex((step) => step.status === status);
  const reachedAt = (stepStatus: OrderStatus) => events.find((event) => event.status === stepStatus)?.createdAt;

  return (
    <div className="grid gap-6">
      <ol className="grid gap-0 lg:grid-cols-6">
        {WORKFLOW_STEPS.map((step, index) => {
          const finished = status === "SHIPPED";
          const done = current >= 0 && (index < current || (finished && index === current));
          const active = index === current && !finished;
          const time = reachedAt(step.status);
          return (
            <li
              key={step.status}
              aria-current={active ? "step" : undefined}
              className="relative grid grid-cols-[2.5rem_1fr] content-start gap-x-4 pb-8 last:pb-0 lg:grid-cols-1 lg:gap-y-4 lg:pb-0 lg:pr-4"
            >
              {index < WORKFLOW_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-5 top-10 h-[calc(100%-2.5rem)] w-px lg:left-10 lg:top-5 lg:h-px lg:w-[calc(100%-2.5rem)]",
                    done ? "bg-accent" : "bg-line-strong",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-10 items-center justify-center rounded-full border text-sm",
                  done && "border-accent bg-accent text-accent-ink",
                  active && "border-accent bg-bg text-accent ring-4 ring-accent/15",
                  !done && !active && "border-line-strong bg-bg text-muted",
                )}
              >
                {done ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : active ? (
                  <span className="relative flex size-3">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
                    <span className="relative inline-flex size-3 rounded-full bg-accent" />
                  </span>
                ) : (
                  <span className="font-mono text-xs">{index + 1}</span>
                )}
              </span>
              <div className="grid content-start gap-1 pt-1 lg:pt-0">
                <p className={cn("font-medium", !done && !active && "text-muted")}>{step.label}</p>
                <p className="text-sm text-muted">{step.detail}</p>
                {time && <p className="font-mono text-xs text-metal-text">{when.format(time)}</p>}
                {active && !time && <p className="font-mono text-xs text-metal-text">acum</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {status === "SHIPPED" && awbNumber && (
        <p className="flex flex-wrap items-center gap-3 rounded-branch border border-line bg-surface px-5 py-4 text-sm">
          <Truck className="size-5 text-metal" strokeWidth={1.5} aria-hidden="true" />
          <span>
            Predată către <strong className="font-medium">{courierName}</strong> · AWB{" "}
            <span className="font-mono">{awbNumber}</span>
          </span>
        </p>
      )}
    </div>
  );
}
