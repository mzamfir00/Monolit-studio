"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { CreditCard, Gift, Minus, PenTool, Plus, Trash2, X } from "lucide-react";
import { SymbolGlyph } from "@/components/engraving/SymbolGlyph";
import { ATELIERS } from "@/lib/branches";
import { getFont, initialsFrom, type EngravingConfig } from "@/lib/engraving";
import { formatRon } from "@/lib/format";
import { getSymbol } from "@/lib/symbols";
import { BRANCHES } from "@/lib/types";
import { cartSubtotal, lineQuote, useCartStore, useHydrated, type CartItem } from "@/store/useCartStore";

function EngravedLines({ lines, config }: { lines: string[]; config: EngravingConfig }) {
  const font = getFont(config.fontKey);
  return (
    <span
      className="grid gap-0.5 rounded-branch border border-line bg-surface px-3 py-2 text-base leading-snug"
      style={{ fontFamily: font.cssFamily, textTransform: font.uppercase ? "uppercase" : undefined }}
    >
      {lines.map((line, index) => (
        <span key={index} className="min-h-5 break-words">
          {line || <span className="font-sans text-xs text-muted">(rând gol)</span>}
        </span>
      ))}
    </span>
  );
}

function ConfigRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="pt-0.5 text-muted">{term}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

/** The full engraving brief for one cart line — what the workshop will cut. */
function EngravingDetails({ config }: { config: EngravingConfig }) {
  const font = getFont(config.fontKey);
  const symbol = getSymbol(config.symbolKey);
  return (
    <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
      <ConfigRow term="Finisaj">{config.variantName}</ConfigRow>
      <ConfigRow term="Gravură">{config.sides === "FRONT_AND_BACK" ? "Față + verso" : "Doar față"}</ConfigRow>
      <ConfigRow term="Font">
        <span style={{ fontFamily: font.cssFamily }} className="text-base">
          {font.label}
        </span>
      </ConfigRow>
      <ConfigRow term="Față">
        {config.frontLines.length > 0 ? (
          <EngravedLines lines={config.frontLines} config={config} />
        ) : (
          <span className="text-muted">Fără text</span>
        )}
      </ConfigRow>
      {config.sides === "FRONT_AND_BACK" && (
        <ConfigRow term="Verso">
          <EngravedLines lines={config.backLines} config={config} />
        </ConfigRow>
      )}
      {symbol && (
        <ConfigRow term="Simbol">
          <span className="flex items-center gap-2">
            <SymbolGlyph
              symbol={symbol}
              initials={initialsFrom(config.frontLines)}
              fontFamily={font.cssFamily}
              className="size-6 shrink-0 text-ink"
            />
            {symbol.name}
          </span>
        </ConfigRow>
      )}
      {config.sketch && (
        <ConfigRow term="Schiță">
          <span className="flex items-center gap-2">
            <PenTool className="size-4 shrink-0 text-metal" aria-hidden="true" />
            <span className="truncate">{config.sketch.name}</span>
          </span>
        </ConfigRow>
      )}
      {config.giftPackaging && (
        <ConfigRow term="Ambalaj">
          <span className="flex items-center gap-2">
            <Gift className="size-4 shrink-0 text-metal" aria-hidden="true" />
            Cutie de catifea + certificat
          </span>
        </ConfigRow>
      )}
    </dl>
  );
}

function CartLine({ item, onNavigate }: { item: CartItem; onNavigate: () => void }) {
  const { updateQuantity, removeItem } = useCartStore();
  const quote = lineQuote(item);
  const atelier = ATELIERS[item.branch];
  return (
    <li className="grid gap-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <span
            data-branch={item.branch}
            className="eyebrow w-fit rounded-full border border-line bg-bg px-2 py-0.5 text-[10px] text-ink"
          >
            {atelier.shortName}
          </span>
          <Link href={`${atelier.href}/produs/${item.slug}`} onClick={onNavigate} className="font-medium hover:underline">
            {item.name}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => removeItem(item.id)}
          aria-label={`Elimină ${item.name}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      <EngravingDetails config={item.engraving} />

      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center rounded-branch border border-line">
          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label={`Scade cantitatea pentru ${item.name}`}
            className="flex size-9 items-center justify-center disabled:opacity-30"
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </button>
          <span className="w-9 text-center text-sm tabular-nums" aria-live="polite">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= item.maxQuantity}
            aria-label={`Crește cantitatea pentru ${item.name}`}
            className="flex size-9 items-center justify-center disabled:opacity-30"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <div className="text-right">
          <p className="font-semibold tabular-nums">{formatRon(quote.totalBani)}</p>
          <p className="text-xs text-muted tabular-nums">
            {formatRon(quote.unitBani)} / buc.
            {quote.discountPercent > 0 && ` · −${quote.discountPercent}% volum`}
          </p>
          {quote.setupFeeBani > 0 && (
            <p className="text-xs text-muted tabular-nums">incl. vectorizare {formatRon(quote.setupFeeBani)}</p>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Slide-over Universal Cart. Mounted inside the page shell, so it inherits whichever atelier is on screen;
 * each line carries a badge themed in the branch it came from and its full engraving brief.
 */
export function CartDrawer() {
  const hydrated = useHydrated();
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const close = useCartStore((state) => state.close);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;
  const lines = hydrated ? items : [];
  const pieces = lines.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-lg animate-drawer-in flex-col border-l border-line bg-bg text-ink shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 id="cart-title" className="display text-2xl">
              Coșul tău
            </h2>
            {pieces > 0 && (
              <p className="text-xs text-muted">
                {pieces} {pieces === 1 ? "piesă gravată" : "piese gravate"} la comandă
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Închide coșul"
            className="flex size-10 items-center justify-center rounded-full hover:bg-ink/5"
          >
            <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center gap-6 px-6">
            <p className="text-muted">
              Coșul tău este gol. Fiecare piesă se gravează la comandă — alege un atelier pentru a începe.
            </p>
            <ul className="grid gap-2">
              {BRANCHES.map((branch) => (
                <li key={branch}>
                  <Link
                    href={ATELIERS[branch].href}
                    onClick={close}
                    data-branch={branch}
                    className="flex items-center justify-between rounded-branch border border-line bg-bg px-4 py-3 text-ink transition-colors hover:bg-surface"
                  >
                    <span className="wordmark text-sm">{ATELIERS[branch].name}</span>
                    <span className="eyebrow text-muted">{ATELIERS[branch].category}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {lines.map((item) => (
                <CartLine key={item.id} item={item} onNavigate={close} />
              ))}
            </ul>
            <footer className="grid gap-3 border-t border-line px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="display text-2xl tabular-nums">{formatRon(cartSubtotal(lines))}</span>
              </div>
              <p className="flex items-center gap-2 text-xs text-muted">
                <CreditCard className="size-3.5 shrink-0" aria-hidden="true" />
                Plata se face exclusiv cu cardul, prin Stripe. Nu livrăm ramburs.
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
