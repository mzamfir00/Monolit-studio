"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn, formatRon } from "@/lib/format";
import type { VolumeTier } from "@/lib/types";

export interface VolumeProduct {
  slug: string;
  name: string;
  priceBani: number;
  volumeTiers: VolumeTier[];
}

const MAX_QUANTITY = 500;

function tierFor(tiers: VolumeTier[], quantity: number): VolumeTier | undefined {
  return tiers.filter((tier) => quantity >= tier.minQuantity).at(-1);
}

/** Corporate estimate: unit price drops through the product's volume tiers (front engraving included). */
export function VolumeCalculator({ products }: { products: VolumeProduct[] }) {
  const ids = useId();
  const [slug, setSlug] = useState(products[0].slug);
  const [quantity, setQuantity] = useState(25);
  const product = products.find((candidate) => candidate.slug === slug) ?? products[0];
  const tiers = [...product.volumeTiers].sort((a, b) => a.minQuantity - b.minQuantity);
  const tier = tierFor(tiers, quantity);
  const discount = tier?.discountPercent ?? 0;
  const unitBani = Math.round((product.priceBani * (100 - discount)) / 100);
  const savedBani = (product.priceBani - unitBani) * quantity;
  const setClamped = (value: number) => setQuantity(Math.min(MAX_QUANTITY, Math.max(1, Math.round(value) || 1)));

  return (
    <div className="grid grid-cols-1 gap-px border border-line bg-line lg:grid-cols-12">
      <div className="grid content-start gap-8 bg-bg p-6 sm:p-9 lg:col-span-7">
        <div className="grid gap-2">
          <label htmlFor={`${ids}-product`} className="eyebrow text-muted">
            Produs
          </label>
          <select
            id={`${ids}-product`}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="h-12 w-full border border-line-strong bg-bg px-3 text-ink"
          >
            {products.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name} — {formatRon(option.priceBani)} / buc.
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3">
          <label htmlFor={`${ids}-qty`} className="eyebrow text-muted">
            Cantitate
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setClamped(quantity - 1)}
              aria-label="Scade cantitatea"
              className="flex size-12 items-center justify-center border border-line-strong hover:bg-surface"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <input
              id={`${ids}-qty`}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_QUANTITY}
              value={quantity}
              onChange={(event) => setClamped(Number(event.target.value))}
              className="h-12 w-28 border border-line-strong bg-bg text-center font-mono text-lg tabular-nums text-ink"
            />
            <button
              type="button"
              onClick={() => setClamped(quantity + 1)}
              aria-label="Crește cantitatea"
              className="flex size-12 items-center justify-center border border-line-strong hover:bg-surface"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
          <input
            type="range"
            min={1}
            max={200}
            value={Math.min(quantity, 200)}
            onChange={(event) => setClamped(Number(event.target.value))}
            aria-label="Cantitate"
            className="w-full accent-[var(--b-accent)]"
          />
        </div>

        <table className="w-full text-left text-sm">
          <caption className="eyebrow mb-3 text-left text-muted">Tranșe de volum</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="py-2 font-normal">
                Cantitate
              </th>
              <th scope="col" className="py-2 font-normal">
                Reducere
              </th>
              <th scope="col" className="py-2 text-right font-normal">
                Preț / buc.
              </th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {[{ minQuantity: 1, discountPercent: 0 }, ...tiers].map((row, index, rows) => {
              const next = rows[index + 1];
              const active = row.minQuantity === (tier?.minQuantity ?? 1);
              return (
                <tr key={row.minQuantity} className={cn("border-b border-line", active && "bg-surface font-semibold")}>
                  <td className="py-2.5 pl-2">
                    {next ? `${row.minQuantity}–${next.minQuantity - 1}` : `${row.minQuantity}+`} buc.
                  </td>
                  <td className="py-2.5">{row.discountPercent ? `−${row.discountPercent}%` : "—"}</td>
                  <td className="py-2.5 pr-2 text-right">
                    {formatRon(Math.round((product.priceBani * (100 - row.discountPercent)) / 100))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid content-between gap-10 bg-accent p-6 text-accent-ink sm:p-9 lg:col-span-5" aria-live="polite">
        <div className="grid gap-6">
          <div>
            <p className="eyebrow opacity-70">Preț unitar</p>
            <p className="display mt-2 text-4xl">{formatRon(unitBani)}</p>
          </div>
          <div>
            <p className="eyebrow opacity-70">Total estimativ · {quantity} buc.</p>
            <p className="display mt-2 text-5xl">{formatRon(unitBani * quantity)}</p>
          </div>
          {savedBani > 0 && (
            <p className="text-sm">
              Economisești <strong>{formatRon(savedBani)}</strong> față de prețul de listă (−{discount}%).
            </p>
          )}
        </div>
        <p className="text-xs opacity-75">
          Prețul include gravura pe față. Gravura pe verso, simbolurile și ambalajul cadou se adaugă în configurator. Factura se
          emite pe firmă, cu CUI și număr de Registrul Comerțului.
        </p>
      </div>
    </div>
  );
}
