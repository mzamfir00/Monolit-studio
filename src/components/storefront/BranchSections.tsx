import Link from "next/link";
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
import type { Branch, CatalogProduct, EngravingMethod } from "@/lib/types";
import { BRANCHES } from "@/lib/types";
import { ENGRAVING_METHODS, MACHINES } from "@/lib/workshop";

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

export function PillarStrip({ branch }: { branch: Branch }) {
  return (
    <section className="border-b border-line">
      <ul className="mx-auto grid max-w-7xl divide-y divide-line sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
        {ATELIERS[branch].pillars.map((pillar) => {
          const Icon = PILLAR_ICONS[pillar.icon];
          return (
            <li key={pillar.title} className="grid content-start gap-3 px-4 py-10 sm:px-8 md:first:pl-0">
              <Icon className="size-6 text-metal" strokeWidth={1.5} aria-hidden="true" />
              <h2 className="display text-2xl">{pillar.title}</h2>
              <p className="text-sm text-muted">{pillar.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CraftSection({ branch, products }: { branch: Branch; products: CatalogProduct[] }) {
  const atelier = ATELIERS[branch];
  const machine = MACHINES[atelier.machine!];
  const methods = [...new Set(products.map((product) => product.engravingMethod))] as EngravingMethod[];
  return (
    <section id="tehnica" className="scroll-mt-16 border-y border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-24">
        <div className="grid content-start gap-5 lg:col-span-4">
          <p className="eyebrow text-metal-text">Tehnica</p>
          <h2 className="display text-h2">Gravat pe {machine.shortLabel}</h2>
          <p className="text-muted">{machine.description}</p>
          <Link href="/#masini" className="flex w-fit items-center gap-2 text-sm font-medium hover:underline">
            Povestea celor trei M20
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:col-span-8">
          {methods.map((method) => {
            const info = ENGRAVING_METHODS[method];
            const used = products.filter((product) => product.engravingMethod === method);
            return (
              <article key={method} className="grid content-start gap-5 rounded-branch-lg border border-line bg-bg p-6 sm:p-8">
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
      </div>
    </section>
  );
}

/** Cross-links to the sibling ateliers, each card rendered in its own theme. */
export function OtherAteliers({ current }: { current: Branch }) {
  return (
    <section id="ateliere" className="scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-h2">Alte ateliere</h2>
          <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:underline">
            Maison Gravure
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {BRANCHES.filter((branch) => branch !== current).map((branch) => {
            const atelier = ATELIERS[branch];
            return (
              <Link
                key={branch}
                href={atelier.href}
                data-branch={branch}
                className="texture group grid min-h-64 content-between gap-10 rounded-branch-lg border border-line bg-bg p-7 text-ink"
              >
                <div className="flex items-start justify-between">
                  <BranchMark atelier={branch} className="size-9 text-metal" />
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
                <div className="grid gap-3">
                  <p className="eyebrow text-muted">{atelier.category}</p>
                  <p className="wordmark text-2xl whitespace-normal">{atelier.name}</p>
                  <p className="text-sm text-muted">{atelier.tagline}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
