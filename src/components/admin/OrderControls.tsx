"use client";

import { useActionState, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Flag, Loader2, Truck } from "lucide-react";
import { advanceOrder, revertOrder, shipOrderAction, toggleUrgent, type ActionResult } from "@/app/admin/(portal)/actions";
import { COURIERS } from "@/lib/admin-ui";
import { cn } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { WORKFLOW_STEPS } from "@/lib/workshop";

function ShipForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(shipOrderAction.bind(null, orderId), {});
  return (
    <form action={action} className="grid gap-2">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2">
        <label className="sr-only" htmlFor={`courier-${orderId}`}>
          Curier
        </label>
        <select
          id={`courier-${orderId}`}
          name="courierName"
          defaultValue={COURIERS[0]}
          className="h-9 min-w-0 rounded-branch border border-line-strong bg-bg px-2 text-sm"
        >
          {COURIERS.map((courier) => (
            <option key={courier}>{courier}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`awb-${orderId}`}>
          Număr AWB
        </label>
        <input
          id={`awb-${orderId}`}
          name="awbNumber"
          required
          placeholder="Număr AWB"
          inputMode="text"
          className="h-9 min-w-0 rounded-branch border border-line-strong bg-bg px-2 font-mono text-sm"
        />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary min-h-9 w-full px-3 disabled:opacity-60">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Truck className="size-4" aria-hidden="true" />
        )}
        Expediază
      </button>
      {state.error && <p className="text-xs text-metal-text">{state.error}</p>}
    </form>
  );
}

/** Station moves, urgency flag and — from packaging — the AWB form. */
export function OrderControls({ orderId, status, isUrgent }: { orderId: string; status: OrderStatus; isUrgent: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const index = WORKFLOW_STEPS.findIndex((step) => step.status === status);
  const previous = index > 0 ? WORKFLOW_STEPS[index - 1] : null;
  const next = index >= 0 && index < WORKFLOW_STEPS.length - 1 ? WORKFLOW_STEPS[index + 1] : null;

  const run = (task: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await task();
      setError(result.error ?? null);
    });

  if (index < 0) return null;
  return (
    <div className="grid gap-2">
      {status === "PACKAGING" ? (
        <ShipForm orderId={orderId} />
      ) : (
        next && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => advanceOrder(orderId))}
            className="btn btn-primary min-h-9 w-full px-3 disabled:opacity-60"
          >
            {next.label}
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="size-4" aria-hidden="true" />
            )}
          </button>
        )
      )}
      <div className="flex items-center justify-between gap-2 text-xs">
        {previous ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => revertOrder(orderId))}
            className="flex items-center gap-1 text-muted hover:text-ink disabled:opacity-50"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {previous.label}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={pending}
          aria-pressed={isUrgent}
          onClick={() => run(() => toggleUrgent(orderId, !isUrgent))}
          className={cn(
            "flex items-center gap-1 hover:text-ink disabled:opacity-50",
            isUrgent ? "font-semibold text-metal-text" : "text-muted",
          )}
        >
          <Flag className="size-3.5" aria-hidden="true" />
          {isUrgent ? "Urgentă" : "Marchează urgentă"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-metal-text">
          {error}
        </p>
      )}
    </div>
  );
}
