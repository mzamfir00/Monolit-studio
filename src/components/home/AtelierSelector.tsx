"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/format";
import type { Branch } from "@/lib/types";

export interface AtelierEntry {
  key: Branch;
  name: string;
  shortName: string;
  category: string;
  tagline: string;
  typePairing: string;
  href: string;
  productCount: number;
  heroCaption: string;
  /** Server-rendered ProductVisual of the atelier's signature piece. */
  visual: ReactNode;
}

const SWATCHES = ["bg-bg", "bg-surface", "bg-accent", "bg-metal"];

/**
 * Hover or focus an atelier and the preview pane re-themes itself live by switching its data-branch.
 * Follows the WAI-ARIA tabs pattern (arrow keys move between ateliers).
 */
export function AtelierSelector({ entries }: { entries: AtelierEntry[] }) {
  const [active, setActive] = useState<Branch>(entries[0].key);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const current = entries.find((entry) => entry.key === active) ?? entries[0];

  function onKeyDown(event: KeyboardEvent, index: number) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + entries.length) % entries.length;
    setActive(entries[next].key);
    tabs.current[next]?.focus();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div
        role="tablist"
        aria-label="Ateliere"
        aria-orientation="vertical"
        className="grid content-start border-t border-line lg:col-span-5"
      >
        {entries.map((entry, index) => {
          const selected = entry.key === active;
          return (
            <button
              key={entry.key}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`atelier-tab-${entry.key}`}
              aria-selected={selected}
              aria-controls="atelier-preview"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(entry.key)}
              onMouseEnter={() => setActive(entry.key)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 border-b border-line py-6 text-left"
            >
              <span className="font-mono text-xs text-muted">0{index + 1}</span>
              <span className="min-w-0">
                <span
                  data-branch={entry.key}
                  className={cn(
                    "wordmark block truncate text-xl transition-opacity sm:text-2xl",
                    !selected && "opacity-55 group-hover:opacity-90",
                  )}
                >
                  {entry.name}
                </span>
                <span className="mt-2 block text-sm text-muted">{entry.category}</span>
              </span>
              <ArrowRight
                aria-hidden="true"
                strokeWidth={1.5}
                className={cn(
                  "size-5 transition-all duration-300",
                  selected ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>

      <div
        id="atelier-preview"
        role="tabpanel"
        aria-labelledby={`atelier-tab-${current.key}`}
        data-branch={current.key}
        className="overflow-hidden rounded-branch-lg border border-line bg-bg text-ink transition-colors duration-500 lg:col-span-7"
      >
        <div key={current.key} className="grid animate-fade-in sm:grid-cols-2">
          <div className="flex flex-col gap-5 p-7 sm:p-9">
            <p className="eyebrow text-metal-text">{current.category}</p>
            <h3 className="display text-h2">{current.name}</h3>
            <p className="text-muted">{current.tagline}</p>
            <div className="mt-auto grid gap-3 pt-4">
              <div className="flex gap-2" aria-hidden="true">
                {SWATCHES.map((swatch) => (
                  <span key={swatch} className={cn("size-7 rounded-full border border-line-strong", swatch)} />
                ))}
              </div>
              <p className="eyebrow text-muted">{current.typePairing}</p>
              <p className="text-sm text-muted">{current.productCount} piese în colecție</p>
            </div>
            <Link href={current.href} className="btn btn-primary w-fit">
              Intră în {current.shortName}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="texture relative min-h-72 bg-surface">
            {current.visual}
            <p className="eyebrow absolute inset-x-6 bottom-5 text-muted">{current.heroCaption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
