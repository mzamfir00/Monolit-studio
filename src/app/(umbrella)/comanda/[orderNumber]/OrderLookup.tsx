"use client";

import { useActionState } from "react";
import { lookupOrder, type LookupState } from "./actions";

export function OrderLookup({ orderNumber }: { orderNumber: string }) {
  const [state, action, pending] = useActionState<LookupState, FormData>(lookupOrder.bind(null, orderNumber), {});
  return (
    <section className="mx-auto grid max-w-lg gap-6 px-4 py-24 sm:px-6">
      <div className="grid gap-3">
        <p className="eyebrow text-metal-text">Comanda {orderNumber}</p>
        <h1 className="display text-h2">Urmărește comanda</h1>
        <p className="text-muted">Pentru siguranță, confirmă adresa de e-mail folosită la plasarea comenzii.</p>
      </div>
      <form action={action} className="grid gap-3">
        <label htmlFor="lookup-email" className="text-sm">
          E-mail
        </label>
        <input
          id="lookup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-12 rounded-branch border border-line-strong bg-bg px-4 text-ink"
        />
        {state.error && (
          <p role="alert" className="text-sm text-metal-text">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-50">
          Vezi comanda
        </button>
      </form>
    </section>
  );
}
