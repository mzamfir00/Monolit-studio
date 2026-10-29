"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { assignMachineAction } from "@/app/admin/(portal)/actions";
import type { Machine } from "@/lib/types";
import { MACHINES, MACHINE_ORDER } from "@/lib/workshop";

/** Re-assigns one piece to another M20; the product's recommended machine is marked. */
export function MachineSelect({
  itemId,
  value,
  recommended,
}: {
  itemId: string;
  value: Machine | null;
  recommended?: Machine | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-1">
      <label className="flex items-center gap-2 text-xs text-muted">
        <span className="shrink-0">Mașină</span>
        <select
          value={value ?? ""}
          disabled={pending}
          onChange={(event) =>
            startTransition(async () => {
              const result = await assignMachineAction(itemId, event.target.value as Machine);
              setError(result.error ?? null);
            })
          }
          className="h-8 min-w-0 flex-1 rounded-branch border border-line-strong bg-bg px-2 text-xs text-ink"
        >
          {!value && <option value="">Nealocată</option>}
          {MACHINE_ORDER.map((machine) => (
            <option key={machine} value={machine}>
              {MACHINES[machine].shortLabel}
              {machine === recommended ? " (recomandată)" : ""}
            </option>
          ))}
        </select>
        {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
      </label>
      {error && <p className="text-xs text-metal-text">{error}</p>}
    </div>
  );
}
