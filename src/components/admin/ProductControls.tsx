"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import { deleteProduct, toggleProductActive, updateStock } from "@/app/admin/(portal)/products/actions";
import { cn } from "@/lib/format";

/** Shows or hides a product in the storefront without opening the editor. */
export function ActiveToggle({ productId, isActive, name }: { productId: string; isActive: boolean; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid justify-items-start gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label={`${name} activ în magazin`}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await toggleProductActive(productId, !isActive);
            setError(result.error ?? null);
          })
        }
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-60",
          isActive ? "border-accent bg-accent" : "border-line-strong bg-surface",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block size-4 rounded-full shadow transition-transform",
            isActive ? "translate-x-6 bg-accent-ink" : "translate-x-1 bg-muted",
          )}
        />
      </button>
      {error && <p className="text-xs text-metal-text">{error}</p>}
    </div>
  );
}

/** Inline correction of the blank count after a delivery or an inventory check. */
export function StockInput({ productId, stock, low, name }: { productId: string; stock: number; low: boolean; name: string }) {
  const [value, setValue] = useState(String(stock));
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ error?: string; ok?: boolean }>({});
  const parsed = Number(value);
  const changed = value.trim() !== "" && parsed !== stock;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!changed) return;
    startTransition(async () => {
      const result = await updateStock(productId, parsed);
      setMessage(result);
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-1">
      <div className="flex items-center gap-1.5">
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value.replace(/[^\d]/g, ""));
            setMessage({});
          }}
          inputMode="numeric"
          aria-label={`Stoc ${name}`}
          aria-invalid={message.error ? true : undefined}
          className={cn(
            "h-8 w-16 rounded-branch border bg-bg px-2 text-right font-mono text-sm tabular-nums",
            low ? "border-metal text-metal-text" : "border-line-strong",
          )}
        />
        {changed ? (
          <button type="submit" disabled={pending} className="h-8 rounded-branch bg-ink px-2 text-xs text-bg disabled:opacity-60">
            {pending ? <Loader2 className="size-3.5 animate-spin" aria-label="Se salvează" /> : "OK"}
          </button>
        ) : (
          message.ok && <Check className="size-4 text-metal" aria-label="Stoc salvat" />
        )}
      </div>
      {message.error && <p className="max-w-[10rem] text-xs text-metal-text">{message.error}</p>}
    </form>
  );
}

/** Deletion is only offered for products that were never ordered; the server checks again. */
export function DeleteProductButton({ productId, name }: { productId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Ștergi definitiv „${name}”? Acțiunea nu poate fi anulată.`)) return;
          startTransition(async () => {
            const result = await deleteProduct(productId);
            if (result?.error) setError(result.error);
          });
        }}
        className="inline-flex w-fit items-center gap-2 rounded-branch border border-line-strong px-3.5 py-2 text-sm text-metal-text hover:border-metal-text disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="size-4" aria-hidden="true" />
        )}
        Șterge produsul
      </button>
      {error && (
        <p role="alert" className="text-sm text-metal-text">
          {error}
        </p>
      )}
    </div>
  );
}
