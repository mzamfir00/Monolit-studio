"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Check, Gift, Minus, PenTool, Plus, ShoppingBag } from "lucide-react";
import { ProductVisual, finishTint, type VisualEngraving } from "@/components/product/ProductVisual";
import {
  DEFAULT_FONT,
  ENGRAVING_FONTS,
  charCount,
  estimateLetterHeightMm,
  getFont,
  initialsFrom,
  sanitizeLine,
  usedLines,
  validateEngraving,
  type EngravingConfig,
  type EngravingErrors,
  type EngravingSides,
  type FontKey,
  type UploadedSketch,
} from "@/lib/engraving";
import { cn, formatNumber, formatRon } from "@/lib/format";
import { GIFT_BOX_FEE_BANI, SKETCH_VECTORIZATION_FEE_BANI, linePricing, quoteLine } from "@/lib/pricing";
import { getSymbol } from "@/lib/symbols";
import type { CatalogProduct } from "@/lib/types";
import { MATERIAL_LABELS } from "@/lib/workshop";
import { useCartStore } from "@/store/useCartStore";
import { OptionCard, Step, Toggle } from "./ConfiguratorUI";
import { SketchUpload } from "./SketchUpload";
import { SymbolPicker } from "./SymbolPicker";

const FORM_ID = "engraving-configurator";

const STEP_IDS: Record<keyof EngravingErrors, string> = {
  variant: "pas-material",
  front: "pas-text",
  back: "pas-text",
  sketch: "pas-schita",
  quantity: "sumar",
};

/** Trims each line and drops trailing empty ones, keeping intentional gaps between lines. */
function normaliseLines(lines: string[]) {
  const trimmed = lines.map((line) => line.trim());
  while (trimmed.length > 0 && trimmed[trimmed.length - 1] === "") trimmed.pop();
  return trimmed;
}

function LineInputs({
  side,
  lines,
  hints,
  maxChars,
  fontFamily,
  uppercase,
  onChange,
  onFocus,
}: {
  side: "front" | "back";
  lines: string[];
  hints: string[];
  maxChars: number;
  fontFamily: string;
  uppercase?: boolean;
  onChange: (index: number, value: string) => void;
  onFocus: () => void;
}) {
  const label = side === "front" ? "Față" : "Verso";
  return (
    <div className="grid gap-4">
      {lines.map((line, index) => {
        const count = charCount(line);
        const full = count >= maxChars;
        const id = `${side}-line-${index}`;
        return (
          <div key={id} className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <label htmlFor={id} className="text-muted">
                {label} · rândul {index + 1}
              </label>
              <span id={`${id}-count`} className={cn("font-mono text-xs tabular-nums", full ? "text-metal-text" : "text-muted")}>
                {count}/{maxChars}
                {full && " · limită atinsă"}
              </span>
            </div>
            <input
              id={id}
              type="text"
              value={line}
              maxLength={maxChars}
              placeholder={hints[index] || `Rândul ${index + 1} (opțional)`}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={`${id}-count`}
              onFocus={onFocus}
              onChange={(event) => onChange(index, sanitizeLine(event.target.value, maxChars))}
              style={{ fontFamily, textTransform: uppercase ? "uppercase" : undefined }}
              className="h-12 w-full rounded-branch border border-line-strong bg-bg px-4 text-lg text-ink placeholder:font-sans placeholder:text-sm placeholder:normal-case placeholder:text-muted"
            />
            <span aria-hidden="true" className="h-0.5 overflow-hidden rounded-full bg-line">
              <span
                className={cn("block h-full transition-[width]", full ? "bg-metal" : "bg-accent")}
                style={{ width: `${(count / maxChars) * 100}%` }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SummaryRow({ label, value, muted }: { label: ReactNode; value: ReactNode; muted?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-1.5", muted && "text-muted")}>
      <dt>{label}</dt>
      <dd className="shrink-0 text-right tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * Type A Personalization Configurator: a structured, step-by-step form (no canvas) whose limits come from
 * the blank's physical engraving area. The SVG preview and the price update on every keystroke.
 */
export function EngravingConfigurator({ product, header }: { product: CatalogProduct; header: ReactNode }) {
  const addItem = useCartStore((state) => state.addItem);
  const defaultVariant = product.variants.find((variant) => variant.isDefault) ?? product.variants[0];

  const [variantName, setVariantName] = useState(defaultVariant.name);
  const [sides, setSides] = useState<EngravingSides>("FRONT");
  const [fontKey, setFontKey] = useState<FontKey>(DEFAULT_FONT[product.branch]);
  const [frontLines, setFrontLines] = useState<string[]>(() => Array(product.maxLines).fill(""));
  const [backLines, setBackLines] = useState<string[]>(() => Array(product.maxLines).fill(""));
  const [symbolKey, setSymbolKey] = useState<string | null>(null);
  const [sketchEnabled, setSketchEnabled] = useState(false);
  const [sketch, setSketch] = useState<UploadedSketch | null>(null);
  const [sketchPreview, setSketchPreview] = useState<string | null>(null);
  const [giftPackaging, setGiftPackaging] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [submitted, setSubmitted] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => () => void (sketchPreview && URL.revokeObjectURL(sketchPreview)), [sketchPreview]);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 4000);
    return () => clearTimeout(timer);
  }, [added]);

  const variant = product.variants.find((candidate) => candidate.name === variantName) ?? defaultVariant;
  const font = getFont(fontKey);
  const symbol = getSymbol(symbolKey) ?? null;
  const withBack = sides === "FRONT_AND_BACK";
  const maxQuantity = Math.max(product.stockQuantity, 0);

  const config: EngravingConfig = useMemo(
    () => ({
      variantName,
      sides,
      fontKey,
      frontLines: normaliseLines(frontLines),
      backLines: withBack ? normaliseLines(backLines) : [],
      symbolKey,
      sketch: sketchEnabled ? sketch : null,
      giftPackaging,
    }),
    [variantName, sides, fontKey, frontLines, backLines, withBack, symbolKey, sketchEnabled, sketch, giftPackaging],
  );

  const pricing = linePricing(product, config);
  const quote = quoteLine(pricing, quantity);
  const errors: EngravingErrors = {
    ...validateEngraving(product, config, quantity),
    ...(sketchEnabled && !sketch ? { sketch: "Încarcă schița sau dezactivează opțiunea." } : {}),
  };
  const errorList = Object.entries(errors) as Array<[keyof EngravingErrors, string]>;
  const shown = (field: keyof EngravingErrors) => (submitted ? errors[field] : undefined);

  const nextTier = product.volumeTiers.find((tier) => tier.minQuantity > quantity);
  const frontHeight = estimateLetterHeightMm(product, frontLines, Boolean(symbol || (sketchEnabled && sketch)));
  const backHeight = estimateLetterHeightMm(product, backLines, false);

  const preview: VisualEngraving =
    previewSide === "back" && withBack
      ? { lines: backLines, fontFamily: font.cssFamily, uppercase: font.uppercase }
      : {
          lines: frontLines,
          fontFamily: font.cssFamily,
          uppercase: font.uppercase,
          symbol,
          initials: initialsFrom(frontLines),
          imageUrl: sketchEnabled && sketch ? sketchPreview : null,
        };

  function updateLine(side: "front" | "back", index: number, value: string) {
    const setter = side === "front" ? setFrontLines : setBackLines;
    setter((lines) => lines.map((line, i) => (i === index ? value : line)));
  }

  function chooseSides(value: EngravingSides) {
    setSides(value);
    setPreviewSide(value === "FRONT_AND_BACK" ? "back" : "front");
  }

  function chooseSymbol(key: string | null) {
    setSymbolKey(key);
    setPreviewSide("front");
    // One graphic per engraving: a symbol replaces an uploaded sketch.
    if (key) setSketchEnabled(false);
  }

  function toggleSketch(enabled: boolean) {
    setSketchEnabled(enabled);
    if (enabled) setSymbolKey(null);
  }

  function onSketchUploaded(uploaded: UploadedSketch, url: string | null) {
    setSketch(uploaded);
    setSketchPreview(url);
    setPreviewSide("front");
  }

  function removeSketch() {
    setSketch(null);
    setSketchPreview(null);
  }

  function setClampedQuantity(value: number) {
    setQuantity(Math.min(Math.max(1, Math.round(value) || 1), Math.max(1, maxQuantity)));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (errorList.length > 0) {
      const target = document.getElementById(STEP_IDS[errorList[0][0]]);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.querySelector<HTMLElement>("input:not([type=radio]), button")?.focus({ preventScroll: true });
      return;
    }
    addItem({
      branch: product.branch,
      slug: product.slug,
      name: product.name,
      quantity,
      maxQuantity,
      pricing,
      engraving: config,
    });
    setAdded(true);
    setSubmitted(false);
  }

  const addLabel = maxQuantity === 0 ? "Stoc epuizat" : `Adaugă în coș · ${formatRon(quote.totalBani)}`;

  return (
    <div className="pb-24 lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14 lg:py-12">
        {/* Live preview */}
        <div className="grid content-start gap-4 lg:sticky lg:top-16 lg:self-start">
          <div className="texture relative overflow-hidden rounded-branch-lg border border-line bg-surface">
            <div
              role="group"
              aria-label="Previzualizare"
              className="absolute left-4 top-4 z-10 flex gap-1 rounded-full bg-bg/85 p-1"
            >
              {(["front", "back"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  aria-pressed={previewSide === side}
                  disabled={side === "back" && !withBack}
                  onClick={() => setPreviewSide(side)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40",
                    previewSide === side ? "bg-ink text-bg" : "text-muted hover:text-ink",
                  )}
                >
                  {side === "front" ? "Față" : "Verso"}
                </button>
              ))}
            </div>
            <ProductVisual
              product={product}
              engraving={preview}
              material={variant.material}
              tint={finishTint(product, variant)}
              showDimensions
              className="mx-auto w-full max-w-[min(34rem,62vh)] p-4 text-muted sm:p-8"
            />
          </div>
          <p className="text-xs text-muted">
            Previzualizare orientativă, la scară. Zona punctată este suprafața gravabilă; compoziția finală o verificăm manual
            înainte de gravare.
          </p>
          <div className="hidden items-center justify-between gap-6 rounded-branch-lg border border-line bg-bg p-5 lg:flex">
            <div>
              <p className="eyebrow text-muted">Total · {quantity} buc.</p>
              <p className="display text-3xl tabular-nums">{formatRon(quote.totalBani)}</p>
            </div>
            <button type="submit" form={FORM_ID} disabled={maxQuantity === 0} className="btn btn-primary disabled:opacity-50">
              <ShoppingBag className="size-4" aria-hidden="true" />
              Adaugă în coș
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="grid content-start gap-10">
          {header}

          <form id={FORM_ID} noValidate onSubmit={submit} className="grid gap-10">
            <Step id="pas-material" index={1} title="Material și finisaj" error={shown("variant")}>
              <div className="grid gap-2 sm:grid-cols-2">
                {product.variants.map((option) => (
                  <OptionCard
                    key={option.name}
                    name="variant"
                    value={option.name}
                    checked={variantName === option.name}
                    onChange={setVariantName}
                  >
                    <span
                      aria-hidden="true"
                      className="size-7 shrink-0 rounded-full border border-line-strong"
                      style={{ background: `radial-gradient(circle at 35% 30%, #ffffff99, transparent 55%), ${option.swatch}` }}
                    />
                    <span className="grid min-w-0 flex-1">
                      <span className="text-sm font-medium">{option.name}</span>
                      <span className="text-xs text-muted">{MATERIAL_LABELS[option.material]}</span>
                    </span>
                    <span className="shrink-0 text-xs font-medium">
                      {option.priceDeltaBani > 0 ? `+${formatRon(option.priceDeltaBani)}` : "Inclus"}
                    </span>
                  </OptionCard>
                ))}
              </div>
            </Step>

            <Step id="pas-fete" index={2} title="Fețe gravate">
              {product.backEngravingAvailable ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <OptionCard name="sides" value="FRONT" checked={sides === "FRONT"} onChange={() => chooseSides("FRONT")}>
                    <span className="grid flex-1">
                      <span className="font-medium">Doar față</span>
                      <span className="text-xs text-muted">Inclus în preț</span>
                    </span>
                  </OptionCard>
                  <OptionCard
                    name="sides"
                    value="FRONT_AND_BACK"
                    checked={withBack}
                    onChange={() => chooseSides("FRONT_AND_BACK")}
                  >
                    <span className="grid flex-1">
                      <span className="font-medium">Față + verso</span>
                      <span className="text-xs text-muted">Text separat pe spate</span>
                    </span>
                    <span className="shrink-0 text-xs font-medium">+{formatRon(product.backEngravingPriceBani)}</span>
                  </OptionCard>
                </div>
              ) : (
                <p className="rounded-branch border border-line bg-raised px-4 py-3 text-sm">
                  <span className="font-medium">Doar față — inclus în preț.</span>{" "}
                  <span className="text-muted">Spatele acestei piese este montat sau nu este accesibil pentru gravură.</span>
                </p>
              )}
            </Step>

            <Step id="pas-font" index={3} title="Tipografie">
              <div role="radiogroup" aria-label="Font de gravură" className="flex flex-wrap gap-2">
                {ENGRAVING_FONTS.map((option) => (
                  <label
                    key={option.key}
                    className="cursor-pointer rounded-full border border-line bg-bg px-5 py-2.5 transition-colors hover:border-line-strong has-checked:border-ink has-checked:bg-ink has-checked:text-bg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
                  >
                    <input
                      type="radio"
                      name="font"
                      value={option.key}
                      checked={fontKey === option.key}
                      onChange={() => setFontKey(option.key)}
                      className="sr-only"
                    />
                    <span className="text-lg leading-none" style={{ fontFamily: option.cssFamily }}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </Step>

            <Step
              id="pas-text"
              index={4}
              title="Textul gravurii"
              aside={`${usedLines(frontLines).length}/${product.maxLines} rânduri`}
              description={`Zona de gravură are ${formatNumber(product.engraveWidthMm)} × ${formatNumber(product.engraveHeightMm)} mm: maximum ${product.maxLines} rânduri a câte ${product.maxCharsPerLine} caractere.`}
              error={shown("front") ?? shown("back")}
            >
              <LineInputs
                side="front"
                lines={frontLines}
                hints={product.frontLineHints}
                maxChars={product.maxCharsPerLine}
                fontFamily={font.cssFamily}
                uppercase={font.uppercase}
                onChange={(index, value) => updateLine("front", index, value)}
                onFocus={() => setPreviewSide("front")}
              />
              {frontHeight && (
                <p className="font-mono text-xs text-muted">
                  Înălțime estimată a literelor pe față: ≈ {formatNumber(frontHeight)} mm
                </p>
              )}
              {withBack && (
                <div className="grid gap-4 border-t border-dashed border-line pt-5">
                  <p className="eyebrow text-muted">
                    Verso · {usedLines(backLines).length}/{product.maxLines} rânduri
                  </p>
                  <LineInputs
                    side="back"
                    lines={backLines}
                    hints={product.backLineHints}
                    maxChars={product.maxCharsPerLine}
                    fontFamily={font.cssFamily}
                    uppercase={font.uppercase}
                    onChange={(index, value) => updateLine("back", index, value)}
                    onFocus={() => setPreviewSide("back")}
                  />
                  {backHeight && (
                    <p className="font-mono text-xs text-muted">
                      Înălțime estimată a literelor pe verso: ≈ {formatNumber(backHeight)} mm
                    </p>
                  )}
                </div>
              )}
            </Step>

            <Step
              id="pas-simbol"
              index={5}
              title="Simbol vectorial"
              aside="Inclus"
              description="Motive vectoriale curate, pregătite pentru M20. Simbolul se gravează pe față, alături de text."
            >
              <SymbolPicker
                value={symbolKey}
                onChange={chooseSymbol}
                defaultCategory={product.symbolSets[0] ?? "pet"}
                initials={initialsFrom(frontLines)}
                fontFamily={font.cssFamily}
              />
            </Step>

            <Step id="pas-schita" index={6} title="Schiță proprie" aside="Opțional" error={shown("sketch")}>
              <Toggle
                checked={sketchEnabled}
                onChange={toggleSketch}
                icon={<PenTool className="size-5" strokeWidth={1.5} />}
                label="Gravez o schiță sau un logo"
                detail="Scrisul de mână, desenul unui copil, amprenta lăbuței sau logo-ul companiei. Ocupă locul simbolului."
                price={`+${formatRon(SKETCH_VECTORIZATION_FEE_BANI)}`}
              />
              {sketchEnabled && (
                <SketchUpload sketch={sketch} previewUrl={sketchPreview} onUploaded={onSketchUploaded} onRemove={removeSketch} />
              )}
            </Step>

            <Step id="pas-ambalaj" index={7} title="Ambalaj cadou">
              <Toggle
                checked={giftPackaging}
                onChange={setGiftPackaging}
                icon={<Gift className="size-5" strokeWidth={1.5} />}
                label="Cutie rigidă de atelier cu inserție de catifea"
                detail="Include Certificatul de Gravură Mecanică, semnat în atelier."
                price={`+${formatRon(GIFT_BOX_FEE_BANI)} / buc.`}
              />
            </Step>

            <section
              id="sumar"
              aria-labelledby="sumar-title"
              className="grid scroll-mt-24 gap-5 rounded-branch-lg border border-line bg-surface p-6 sm:p-8"
            >
              <h2 id="sumar-title" className="display text-2xl">
                Sumar
              </h2>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <label htmlFor="quantity" className="text-sm">
                  Cantitate
                  <span className="block text-xs text-muted">{maxQuantity} semifabricate în stoc</span>
                </label>
                <div className="flex items-center rounded-branch border border-line-strong bg-bg">
                  <button
                    type="button"
                    onClick={() => setClampedQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                    aria-label="Scade cantitatea"
                    className="flex size-11 items-center justify-center disabled:opacity-30"
                  >
                    <Minus className="size-4" aria-hidden="true" />
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={maxQuantity}
                    value={quantity}
                    onChange={(event) => setClampedQuantity(Number(event.target.value))}
                    className="h-11 w-16 [appearance:textfield] bg-transparent text-center font-mono tabular-nums text-ink [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setClampedQuantity(quantity + 1)}
                    disabled={quantity >= maxQuantity}
                    aria-label="Crește cantitatea"
                    className="flex size-11 items-center justify-center disabled:opacity-30"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              {nextTier && (
                <p className="-mt-2 text-xs text-metal-text">
                  De la {nextTier.minQuantity} bucăți: −{nextTier.discountPercent}% pe piesă.
                </p>
              )}

              <dl className="divide-y divide-line border-y border-line text-sm" aria-live="polite">
                <SummaryRow label={`${product.name} · ${variant.name}`} value={formatRon(pricing.baseUnitBani)} />
                {quote.discountPercent > 0 && (
                  <SummaryRow
                    label={`Reducere de volum −${quote.discountPercent}%`}
                    value={`−${formatRon(pricing.baseUnitBani - (quote.unitBani - pricing.extrasUnitBani))}`}
                  />
                )}
                <SummaryRow label="Gravură față" value="Inclusă" muted />
                {withBack && <SummaryRow label="Gravură verso" value={`+${formatRon(product.backEngravingPriceBani)}`} />}
                {giftPackaging && <SummaryRow label="Cutie de catifea + certificat" value={`+${formatRon(GIFT_BOX_FEE_BANI)}`} />}
                <SummaryRow label="Preț per piesă" value={formatRon(quote.unitBani)} />
                {quantity > 1 && <SummaryRow label="Cantitate" value={`× ${quantity}`} muted />}
                {quote.setupFeeBani > 0 && (
                  <SummaryRow label="Vectorizare schiță (o singură dată)" value={`+${formatRon(quote.setupFeeBani)}`} />
                )}
              </dl>

              <div className="flex items-baseline justify-between gap-4">
                <span className="text-muted">Total</span>
                <span className="display text-4xl tabular-nums">{formatRon(quote.totalBani)}</span>
              </div>
              {quote.savedBani > 0 && (
                <p className="-mt-3 text-right text-xs text-metal-text">Economisești {formatRon(quote.savedBani)}</p>
              )}

              {submitted && errorList.length > 0 && (
                <ul role="alert" className="grid gap-1 rounded-branch border border-metal/50 bg-bg p-4 text-sm">
                  {[...new Set(errorList.map(([, message]) => message))].map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}

              <button type="submit" disabled={maxQuantity === 0} className="btn btn-primary w-full disabled:opacity-50">
                <ShoppingBag className="size-4" aria-hidden="true" />
                {addLabel}
              </button>
              <p aria-live="polite" className="-mt-2 flex min-h-5 items-center justify-center gap-2 text-sm">
                {added && (
                  <>
                    <Check className="size-4 text-metal" aria-hidden="true" />
                    Adăugat în coș — configurația este salvată pe acest dispozitiv.
                  </>
                )}
              </p>
              <p className="text-center text-xs text-muted">
                Plata exclusiv cu cardul · Execuție în {product.leadTimeDays} zile lucrătoare de la plată
              </p>
            </section>
          </form>
        </div>
      </div>

      {/* Mobile price bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-[10px] text-muted">Total · {quantity} buc.</p>
            <p className="text-xl font-semibold tabular-nums">{formatRon(quote.totalBani)}</p>
          </div>
          <button type="submit" form={FORM_ID} disabled={maxQuantity === 0} className="btn btn-primary disabled:opacity-50">
            Adaugă în coș
          </button>
        </div>
      </div>
    </div>
  );
}
