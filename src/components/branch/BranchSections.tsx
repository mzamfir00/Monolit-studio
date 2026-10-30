import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Calculator,
  Crosshair,
  Factory,
  Flame,
  Gem,
  Gift,
  Hourglass,
  Layers,
  Phone,
  Receipt,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { EngravingDiagram } from "@/components/home/EngravingDiagram";
import { BranchMark } from "@/components/shell/BranchMark";
import { ATELIERS, type Pillar } from "@/lib/branches";
import { cn } from "@/lib/format";
import type { Branch, CatalogProduct, EngravingMethod } from "@/lib/types";
import { BRANCHES } from "@/lib/types";
import { ENGRAVING_METHODS, MACHINES } from "@/lib/workshop";
import { Crosshairs, PANEL, pad2, toRoman } from "./primitives";

const PILLAR_ICONS: Record<Pillar["icon"], LucideIcon> = {
  shield: Shield,
  layers: Layers,
  phone: Phone,
  gem: Gem,
  sparkles: Sparkles,
  gift: Gift,
  flame: Flame,
  crosshair: Crosshair,
  hourglass: Hourglass,
  calculator: Calculator,
  receipt: Receipt,
  factory: Factory,
};

interface HeadingProps {
  branch: Branch;
  /** Position of the section on the page and how many there are (01 / 04). */
  index: number;
  total: number;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  id?: string;
}

/** Section header, drawn in each atelier's own typographic system. */
export function BranchHeading({ branch, index, total, eyebrow, title, lead, id }: HeadingProps) {
  switch (branch) {
    case "pet":
      return (
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="grid max-w-2xl gap-5">
            <p className="inline-flex w-fit items-center gap-2.5 rounded-full border-2 border-dashed border-accent/25 py-1.5 pl-1.5 pr-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              <span className="grid size-6 place-items-center rounded-full bg-accent text-[10px] tracking-normal text-panel">
                {index}
              </span>
              {eyebrow}
            </p>
            <h2 id={id} className="display text-h2">
              {title}
            </h2>
          </div>
          {lead && <p className="max-w-md text-muted">{lead}</p>}
        </div>
      );
    case "jewelry":
      return (
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-metal-text">
            {toRoman(index)} — {eyebrow}
          </p>
          <h2 id={id} className="display mt-6 text-h2">
            {title}
          </h2>
          <span aria-hidden="true" className="mx-auto mt-8 block h-px w-12 bg-accent" />
          {lead && <p className="mt-8 leading-relaxed text-muted">{lead}</p>}
        </div>
      );
    case "vault":
      return (
        <div className="mb-10 grid gap-5">
          <div className="flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.14em]">
            <span className="text-accent">
              {"//"} {pad2(index)} — {eyebrow}
            </span>
            <span className="text-muted">
              [{pad2(index)}/{pad2(total)}]
            </span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id={id} className="display text-h2">
              {title}
            </h2>
            {lead && <p className="max-w-md text-muted">{lead}</p>}
          </div>
          <div aria-hidden="true" className="ruler-x" />
        </div>
      );
    case "corporate":
      return (
        <div className="grid border-x border-t border-grid md:grid-cols-[8rem_minmax(0,1fr)_minmax(0,22rem)]">
          <p className="border-b border-grid px-5 py-4 font-mono text-[11px] uppercase tracking-[0.12em] md:border-b-0 md:border-r">
            {pad2(index)} / {pad2(total)}
          </p>
          <h2 id={id} className="display border-b border-grid px-5 py-5 text-h2 md:border-b-0 md:border-r md:px-7">
            {title}
          </h2>
          <div className="grid content-center gap-2 px-5 py-5 md:px-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">{eyebrow}</p>
            {lead && <p className="text-sm text-muted">{lead}</p>}
          </div>
        </div>
      );
  }
}

/** The atelier's three promises, as stitched cards, hairline columns, HUD modules or grid cells. */
export function BranchPillars({ branch }: { branch: Branch }) {
  const pillars = ATELIERS[branch].pillars;
  switch (branch) {
    case "pet":
      return (
        <section aria-label="Promisiunile atelierului" className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
          <ul className="grid gap-5 md:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = PILLAR_ICONS[pillar.icon];
              return (
                <li key={pillar.title} className={cn(PANEL.pet, "grid content-start gap-4 p-8")}>
                  <span className="grid size-12 place-items-center rounded-full bg-accent text-panel">
                    <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h2 className="display text-2xl">{pillar.title}</h2>
                  <p className="text-sm leading-relaxed text-muted">{pillar.body}</p>
                </li>
              );
            })}
          </ul>
        </section>
      );
    case "jewelry":
      return (
        <section aria-label="Promisiunile atelierului" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <ul className="grid divide-y-[0.5px] divide-line border-y-[0.5px] border-line md:grid-cols-3 md:divide-x-[0.5px] md:divide-y-0">
            {pillars.map((pillar, index) => (
              <li key={pillar.title} className="grid content-start gap-4 px-8 py-14 text-center">
                <span className="display text-lg italic text-metal-text">{toRoman(index + 1)}.</span>
                <h2 className="display text-2xl">{pillar.title}</h2>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted">{pillar.body}</p>
              </li>
            ))}
          </ul>
        </section>
      );
    case "vault":
      return (
        <section aria-label="Promisiunile atelierului" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <ul className="grid gap-5 md:grid-cols-3">
            {pillars.map((pillar, index) => {
              const Icon = PILLAR_ICONS[pillar.icon];
              return (
                <li key={pillar.title} className="relative grid content-start gap-4 border border-line bg-surface p-6">
                  <Crosshairs className="text-line-strong" />
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                    <span>MOD-{pad2(index + 1)}</span>
                    <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h2 className="display text-xl">{pillar.title}</h2>
                  <p className="text-sm leading-relaxed text-muted">{pillar.body}</p>
                </li>
              );
            })}
          </ul>
        </section>
      );
    case "corporate":
      return (
        <section aria-label="Promisiunile atelierului" className="mx-auto max-w-7xl px-4 sm:px-6">
          <ul className="grid border-l border-grid md:grid-cols-3">
            {pillars.map((pillar, index) => {
              const Icon = PILLAR_ICONS[pillar.icon];
              return (
                <li key={pillar.title} className="grid content-start gap-6 border-b border-r border-grid p-7">
                  <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em]">
                    <span>N° {pad2(index + 1)}</span>
                    <Icon className="size-4 text-accent" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h2 className="display text-xl">{pillar.title}</h2>
                  <p className="text-sm leading-relaxed text-muted">{pillar.body}</p>
                </li>
              );
            })}
          </ul>
        </section>
      );
  }
}

const CRAFT_BAND: Record<Branch, string> = {
  pet: "bg-surface/60",
  jewelry: "border-y-[0.5px] border-line bg-panel",
  vault: "border-y border-line bg-bg/70",
  corporate: "",
};

export function CraftSection({
  branch,
  products,
  index,
  total,
}: {
  branch: Branch;
  products: CatalogProduct[];
  index: number;
  total: number;
}) {
  const atelier = ATELIERS[branch];
  const machine = MACHINES[atelier.machine!];
  const methods = [...new Set(products.map((product) => product.engravingMethod))] as EngravingMethod[];
  return (
    <section id="tehnica" className={cn("scroll-mt-16", CRAFT_BAND[branch])}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
        <BranchHeading
          branch={branch}
          index={index}
          total={total}
          eyebrow="Tehnica"
          title={`Gravat pe ${machine.shortLabel}`}
          lead={machine.description}
        />
        <div
          className={cn(
            "grid md:grid-cols-2",
            branch === "corporate" ? "border-l border-t border-grid" : "gap-6",
            branch === "jewelry" && "gap-10",
            // A single technique (Aurum is diamond-only) gets a centred column instead of half a row.
            methods.length === 1 && "md:mx-auto md:max-w-2xl md:grid-cols-1",
          )}
        >
          {methods.map((method) => {
            const info = ENGRAVING_METHODS[method];
            const used = products.filter((product) => product.engravingMethod === method);
            return (
              <article
                key={method}
                className={cn(
                  "relative grid content-start gap-5 p-6 sm:p-8",
                  branch === "corporate" ? "border-b border-r border-grid bg-panel" : PANEL[branch],
                )}
              >
                {branch === "vault" && <Crosshairs className="text-line-strong" />}
                <EngravingDiagram method={method} className="w-full text-muted" />
                <div className="grid gap-2">
                  <p className="eyebrow text-metal-text">{info.depthNote}</p>
                  <h3 className="display text-2xl">{info.label}</h3>
                  <p className="text-sm text-muted">{info.summary}</p>
                </div>
                <ul className="grid gap-1 border-t border-line pt-4 text-sm">
                  {used.map((product) => (
                    <li key={product.slug}>
                      <Link href={`${atelier.href}/produs/${product.slug}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        <Link href="/#masini" className="mt-8 flex w-fit items-center gap-2 text-sm font-medium hover:underline">
          Povestea celor trei M20
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/** Cross-links to the sibling ateliers; each card is cut in its own atelier's geometry and theme. */
export function OtherAteliers({ current, index, total }: { current: Branch; index: number; total: number }) {
  return (
    <section id="ateliere" className="scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <BranchHeading branch={current} index={index} total={total} eyebrow="Maison Gravure" title="Alte ateliere" />
        <div className={cn("grid md:grid-cols-3", current === "corporate" ? "border-l border-t border-grid" : "gap-6")}>
          {BRANCHES.filter((branch) => branch !== current).map((branch) => {
            const atelier = ATELIERS[branch];
            const card = (
              <Link
                key={branch}
                href={atelier.href}
                data-branch={branch}
                className={cn("group relative grid h-full min-h-64 content-between gap-10 p-7 text-ink", PANEL[branch])}
              >
                <div className="flex items-start justify-between">
                  <BranchMark atelier={branch} className="size-9 text-metal" />
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
                <div className="grid gap-3">
                  <p className="eyebrow text-muted">{atelier.category}</p>
                  <p className="wordmark whitespace-normal text-2xl">{atelier.name}</p>
                  <p className="text-sm text-muted">{atelier.tagline}</p>
                </div>
              </Link>
            );
            // On the Bespoke grid every atelier card sits in a ruled cell, like a sample in a specification binder.
            return current === "corporate" ? (
              <div key={branch} className="border-b border-r border-grid p-3">
                {card}
              </div>
            ) : (
              card
            );
          })}
        </div>
      </div>
    </section>
  );
}
