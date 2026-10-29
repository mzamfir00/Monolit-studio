"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Check, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { saveProduct } from "@/app/admin/(portal)/products/actions";
import { ProductVisual } from "@/components/product/ProductVisual";
import { ATELIERS } from "@/lib/branches";
import { cn, formatMm, formatRon } from "@/lib/format";
import {
  MATERIALS,
  MATERIAL_SWATCHES,
  MAX_ENGRAVE_LINES,
  VISUAL_KEYS,
  VISUAL_LABELS,
  normalizeProduct,
  slugify,
  validateProduct,
  type ProductErrors,
  type ProductInput,
} from "@/lib/product-schema";
import { SYMBOL_CATEGORIES } from "@/lib/symbols";
import { BRANCHES, type Branch, type CatalogProduct, type EngravingMethod, type Machine, type Material } from "@/lib/types";
import { ENGRAVING_METHODS, MACHINES, MACHINE_ORDER, MATERIAL_LABELS, machineForBranch } from "@/lib/workshop";

const inputClass =
  "h-10 w-full min-w-0 rounded-branch border border-line-strong bg-bg px-3 text-sm text-ink placeholder:text-muted aria-invalid:border-metal-text";

// ── Field primitives ────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  /** Label read by screen readers only (repeated rows under a visible column header). */
  labelClassName?: string;
}

const describedBy = (id: string, error?: string, hint?: ReactNode) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

function Field({ id, label, error, hint, className, labelClassName, children }: FieldProps & { children: ReactNode }) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-sm", labelClassName)}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-metal-text">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function TextField({
  value,
  onValue,
  ...props
}: FieldProps & { value: string; onValue: (value: string) => void } & Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "value" | "onChange" | "className"
  >) {
  const { id, label, error, hint, className, labelClassName, ...input } = props;
  return (
    <Field id={id} label={label} error={error} hint={hint} className={className} labelClassName={labelClassName}>
      <input
        id={id}
        value={value}
        onChange={(event) => onValue(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={inputClass}
        {...input}
      />
    </Field>
  );
}

const formatDecimal = (value: number, scale: number) => (Number.isFinite(value) ? String(value / scale).replace(".", ",") : "");

function parseDecimal(text: string, scale: number): number {
  const normalized = text.trim().replace(",", ".");
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) return Number.NaN;
  return Number(normalized) * scale;
}

/**
 * Decimal input that accepts a Romanian comma and keeps the text being typed ("12," stays "12,").
 * `scale` converts the display unit to the stored one: RON shown, bani stored → scale 100.
 */
function NumberField({
  value,
  onValue,
  scale = 1,
  unit,
  ...props
}: FieldProps & { value: number; onValue: (value: number) => void; scale?: number; unit?: string }) {
  const { id, label, error, hint, className, labelClassName } = props;
  const [text, setText] = useState(() => formatDecimal(value, scale));
  const [shown, setShown] = useState(value);
  // Adopt values set from outside (a save normalising the draft, a removed row) without fighting the typist.
  if (!Object.is(shown, value)) {
    setShown(value);
    setText(formatDecimal(value, scale));
  }
  return (
    <Field id={id} label={label} error={error} hint={hint} className={className} labelClassName={labelClassName}>
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(event) => {
            const next = parseDecimal(event.target.value, scale);
            setText(event.target.value);
            setShown(next);
            onValue(next);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(inputClass, "font-mono tabular-nums", unit && "pr-12")}
        />
        {unit && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted"
          >
            {unit}
          </span>
        )}
      </div>
    </Field>
  );
}

function SelectField<T extends string>({
  value,
  onValue,
  options,
  ...props
}: FieldProps & { value: T; onValue: (value: T) => void; options: Array<{ value: T; label: string }> }) {
  const { id, label, error, hint, className, labelClassName } = props;
  return (
    <Field id={id} label={label} error={error} hint={hint} className={className} labelClassName={labelClassName}>
      <select
        id={id}
        value={value}
        onChange={(event) => onValue(event.target.value as T)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-branch border border-line bg-bg px-3 py-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-accent"
      />
      <span className="grid gap-0.5">
        <span className="text-sm">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

/** One input per engraving line (hints, sample text). */
function LinesField({
  id,
  label,
  error,
  hint,
  count,
  values,
  placeholder,
  onValues,
}: FieldProps & {
  count: number;
  values: string[];
  placeholder: (index: number) => string;
  onValues: (values: string[]) => void;
}) {
  return (
    <fieldset className="grid content-start gap-1.5" aria-describedby={describedBy(id, error, hint)}>
      <legend className="mb-1.5 text-sm">{label}</legend>
      {Array.from({ length: count }, (_, index) => (
        <input
          key={index}
          id={index === 0 ? id : `${id}-${index}`}
          aria-label={`${label}, rândul ${index + 1}`}
          value={values[index] ?? ""}
          placeholder={placeholder(index)}
          onChange={(event) => {
            const next = Array.from({ length: count }, (_, i) => values[i] ?? "");
            next[index] = event.target.value;
            onValues(next);
          }}
          aria-invalid={error ? true : undefined}
          className={inputClass}
        />
      ))}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-metal-text">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </fieldset>
  );
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-5 rounded-branch-lg border border-line bg-bg p-5 sm:p-6">
      <header className="grid gap-1">
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </header>
      {children}
    </section>
  );
}

function ChoiceCard({
  name,
  checked,
  onSelect,
  title,
  detail,
  aside,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
  aside?: string;
}) {
  return (
    <label
      className={cn(
        "grid cursor-pointer gap-1 rounded-branch border px-3.5 py-3 transition-colors",
        checked ? "border-ink bg-surface" : "border-line bg-bg hover:border-line-strong",
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2.5 text-sm font-medium">
          <input type="radio" name={name} checked={checked} onChange={onSelect} className="size-4 accent-accent" />
          {title}
        </span>
        {aside && <span className="shrink-0 text-xs text-metal-text">{aside}</span>}
      </span>
      <span className="pl-6.5 text-xs text-muted">{detail}</span>
    </label>
  );
}

// ── Preview ─────────────────────────────────────────────────────────────────────────────────────

const usable = (...values: number[]) => values.every((value) => Number.isFinite(value) && value > 0);

/** A drawable copy of the draft: ProductVisual needs real dimensions and at least one finish. */
function previewOf(input: ProductInput): CatalogProduct | null {
  if (!usable(input.widthMm, input.heightMm, input.depthMm, input.engraveWidthMm, input.engraveHeightMm)) return null;
  const lineLimit = Number.isInteger(input.maxCharsPerLine) && input.maxCharsPerLine > 0 ? input.maxCharsPerLine : 14;
  const sample = input.sampleEngraving.filter(Boolean);
  return {
    ...input,
    sampleEngraving: sample.length > 0 ? sample : [input.name.toUpperCase().slice(0, lineLimit) || "MAISON"],
    variants: input.variants.map((variant) => ({
      ...variant,
      swatch: /^#[0-9a-f]{6}$/.test(variant.swatch) ? variant.swatch : "#b5945b",
    })),
  };
}

// ── Form ────────────────────────────────────────────────────────────────────────────────────────

const HIGHLIGHTS_HINT = "Câte unul pe rând, cel mult 8.";
const snapshot = (input: ProductInput) => JSON.stringify(normalizeProduct(input));

export function ProductForm({ productId, initial }: { productId: string | null; initial: ProductInput }) {
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(() => snapshot(initial));
  const [slugTouched, setSlugTouched] = useState(productId !== null);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<ProductErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [pending, startTransition] = useTransition();
  const rowKey = useRef(0);
  const [variantKeys, setVariantKeys] = useState(() => initial.variants.map(() => rowKey.current++));
  const [tierKeys, setTierKeys] = useState(() => initial.volumeTiers.map(() => rowKey.current++));

  const normalized = useMemo(() => normalizeProduct(draft), [draft]);
  const clientErrors = useMemo(() => validateProduct(normalized), [normalized]);
  const errors: ProductErrors = showErrors ? { ...clientErrors, ...serverErrors } : serverErrors;
  const errorCount = Object.keys(errors).length;
  const dirty = JSON.stringify(normalized) !== baseline;
  const preview = useMemo(() => previewOf(normalized), [normalized]);
  const lineCount =
    Number.isInteger(draft.maxLines) && draft.maxLines >= 1 ? Math.min(draft.maxLines, MAX_ENGRAVE_LINES) : MAX_ENGRAVE_LINES;
  const suggested = machineForBranch(draft.branch);
  const atelier = ATELIERS[draft.branch];

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (focusRequest === 0) return;
    const invalid = document.querySelector<HTMLElement>("#product-form [aria-invalid='true']");
    invalid?.focus();
    invalid?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusRequest]);

  const update = (patch: Partial<ProductInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setServerErrors({});
    setFormError(null);
    setSavedAt(null);
  };
  const err = (key: string) => errors[key];

  const setVariant = (index: number, patch: Partial<ProductInput["variants"][number]>) =>
    update({ variants: draft.variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)) });
  const makeDefault = (index: number) =>
    update({ variants: draft.variants.map((variant, i) => ({ ...variant, isDefault: i === index })) });
  const addVariant = () => {
    const base = draft.variants.find((variant) => variant.isDefault) ?? draft.variants[0];
    update({
      variants: [
        ...draft.variants,
        {
          name: "",
          material: draft.material,
          swatch: base?.material === draft.material ? base.swatch : MATERIAL_SWATCHES[draft.material],
          priceDeltaBani: 0,
          isDefault: draft.variants.length === 0,
        },
      ],
    });
    setVariantKeys((keys) => [...keys, rowKey.current++]);
  };
  const removeVariant = (index: number) => {
    const remaining = draft.variants.filter((_, i) => i !== index);
    if (remaining.length > 0 && !remaining.some((variant) => variant.isDefault))
      remaining[0] = { ...remaining[0], isDefault: true };
    update({ variants: remaining });
    setVariantKeys((keys) => keys.filter((_, i) => i !== index));
  };

  const setTier = (index: number, patch: Partial<ProductInput["volumeTiers"][number]>) =>
    update({ volumeTiers: draft.volumeTiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)) });
  const addTier = () => {
    const last = draft.volumeTiers[draft.volumeTiers.length - 1];
    const minQuantity = last && Number.isFinite(last.minQuantity) ? last.minQuantity * 2 : 10;
    const discountPercent = last && Number.isFinite(last.discountPercent) ? Math.min(last.discountPercent + 5, 60) : 5;
    update({ volumeTiers: [...draft.volumeTiers, { minQuantity, discountPercent }] });
    setTierKeys((keys) => [...keys, rowKey.current++]);
  };
  const removeTier = (index: number) => {
    update({ volumeTiers: draft.volumeTiers.filter((_, i) => i !== index) });
    setTierKeys((keys) => keys.filter((_, i) => i !== index));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (Object.keys(clientErrors).length > 0) {
      setFocusRequest((count) => count + 1);
      return;
    }
    startTransition(async () => {
      // Creating redirects to the new product's page; updating returns here.
      const result = await saveProduct(productId, normalized);
      if (!result) return;
      if (result.errors) {
        setServerErrors(result.errors);
        setFocusRequest((count) => count + 1);
      } else if (result.error) {
        setFormError(result.error);
      } else if (result.ok) {
        // Adopt the stored form (rounded mm, bani, trimmed text, tiers sorted by quantity).
        setDraft(normalized);
        setBaseline(JSON.stringify(normalized));
        setVariantKeys(normalized.variants.map(() => rowKey.current++));
        setTierKeys(normalized.volumeTiers.map(() => rowKey.current++));
        setShowErrors(false);
        setSavedAt(Date.now());
      }
    });
  };

  const unitPrice = (discountPercent: number) =>
    Number.isFinite(draft.priceBani) && Number.isFinite(discountPercent)
      ? formatRon(Math.round((draft.priceBani * (100 - discountPercent)) / 100))
      : "—";

  return (
    <form id="product-form" onSubmit={submit} noValidate className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid gap-6">
        <Section id="sectiune-identitate" title="Identitate în magazin" description="Ce vede clientul pe pagina produsului.">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="branch"
              label="Atelier"
              value={draft.branch}
              onValue={(branch: Branch) => update({ branch })}
              options={BRANCHES.map((branch) => ({ value: branch, label: ATELIERS[branch].name }))}
            />
            <TextField
              id="name"
              label="Nume produs"
              value={draft.name}
              error={err("name")}
              onValue={(name) => update(slugTouched ? { name } : { name, slug: slugify(name) })}
            />
            <TextField
              id="slug"
              label="Adresă (slug)"
              value={draft.slug}
              error={err("slug")}
              hint={
                productId
                  ? `/${draft.branch}/produs/${normalized.slug || "…"} · schimbarea rupe linkurile deja trimise`
                  : `/${draft.branch}/produs/${normalized.slug || "…"}`
              }
              spellCheck={false}
              onValue={(slug) => {
                setSlugTouched(true);
                update({ slug });
              }}
            />
            <TextField
              id="subtitle"
              label="Subtitlu"
              value={draft.subtitle}
              error={err("subtitle")}
              onValue={(subtitle) => update({ subtitle })}
              placeholder="Alamă masivă · 30 mm · 3 mm grosime"
            />
            <Field id="description" label="Descriere" error={err("description")} className="sm:col-span-2">
              <textarea
                id="description"
                rows={5}
                value={draft.description}
                onChange={(event) => update({ description: event.target.value })}
                aria-invalid={err("description") ? true : undefined}
                aria-describedby={describedBy("description", err("description"))}
                className={cn(inputClass, "h-auto py-2.5 leading-relaxed")}
              />
            </Field>
            <Field
              id="highlights"
              label="Puncte forte"
              hint={HIGHLIGHTS_HINT}
              error={err("highlights")}
              className="sm:col-span-2"
            >
              <textarea
                id="highlights"
                rows={4}
                value={draft.highlights.join("\n")}
                onChange={(event) => update({ highlights: event.target.value.split("\n") })}
                aria-invalid={err("highlights") ? true : undefined}
                aria-describedby={describedBy("highlights", err("highlights"), HIGHLIGHTS_HINT)}
                className={cn(inputClass, "h-auto py-2.5 leading-relaxed")}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Toggle
              id="isActive"
              label="Activ în magazin"
              hint="Inactiv = ascuns, comenzile rămân."
              checked={draft.isActive}
              onChange={(isActive) => update({ isActive })}
            />
            <Toggle
              id="isFeatured"
              label="Capodoperă pe prima pagină"
              checked={draft.isFeatured}
              onChange={(isFeatured) => update({ isFeatured })}
            />
            <NumberField
              id="sortOrder"
              label="Ordine în colecție"
              value={draft.sortOrder}
              error={err("sortOrder")}
              onValue={(sortOrder) => update({ sortOrder })}
              hint="Mai mic = mai sus."
            />
          </div>
        </Section>

        <Section id="sectiune-pret" title="Preț, stoc și termen">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <NumberField
              id="priceBani"
              label="Preț de bază"
              unit="RON"
              scale={100}
              value={draft.priceBani}
              error={err("priceBani")}
              hint="Gravura pe față inclusă."
              onValue={(priceBani) => update({ priceBani })}
            />
            <NumberField
              id="stockQuantity"
              label="Semifabricate în stoc"
              unit="buc."
              value={draft.stockQuantity}
              error={err("stockQuantity")}
              onValue={(stockQuantity) => update({ stockQuantity })}
            />
            <NumberField
              id="lowStockThreshold"
              label="Alertă stoc sub"
              unit="buc."
              value={draft.lowStockThreshold}
              error={err("lowStockThreshold")}
              onValue={(lowStockThreshold) => update({ lowStockThreshold })}
            />
            <NumberField
              id="leadTimeDays"
              label="Termen de execuție"
              unit="zile"
              value={draft.leadTimeDays}
              error={err("leadTimeDays")}
              hint="Zile lucrătoare de la plată."
              onValue={(leadTimeDays) => update({ leadTimeDays })}
            />
          </div>
        </Section>

        <Section
          id="sectiune-m20"
          title="Semifabricat și parametri M20"
          description="Dimensiunile reale, în milimetri: din ele se desenează produsul și se generează fișierul SVG pentru Gravostyle."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TextField
              id="blankSku"
              label="Cod semifabricat"
              value={draft.blankSku}
              error={err("blankSku")}
              onValue={(blankSku) => update({ blankSku: blankSku.toUpperCase() })}
              placeholder="PET-HEX-BR-30"
              spellCheck={false}
              className="xl:col-span-2"
            />
            <SelectField
              id="material"
              label="Material gravat"
              value={draft.material}
              onValue={(material: Material) => update({ material })}
              options={MATERIALS.map((material) => ({ value: material, label: MATERIAL_LABELS[material] }))}
              className="xl:col-span-2"
            />
            <NumberField
              id="widthMm"
              label="Lățime piesă"
              unit="mm"
              value={draft.widthMm}
              error={err("widthMm")}
              onValue={(widthMm) => update({ widthMm })}
            />
            <NumberField
              id="heightMm"
              label="Înălțime piesă"
              unit="mm"
              value={draft.heightMm}
              error={err("heightMm")}
              onValue={(heightMm) => update({ heightMm })}
            />
            <NumberField
              id="depthMm"
              label="Grosime piesă"
              unit="mm"
              value={draft.depthMm}
              error={err("depthMm")}
              onValue={(depthMm) => update({ depthMm })}
            />
            <NumberField
              id="weightGrams"
              label="Greutate"
              unit="g"
              value={draft.weightGrams}
              error={err("weightGrams")}
              onValue={(weightGrams) => update({ weightGrams })}
            />
            <NumberField
              id="engraveWidthMm"
              label="Zonă gravură · lățime"
              unit="mm"
              value={draft.engraveWidthMm}
              error={err("engraveWidthMm")}
              onValue={(engraveWidthMm) => update({ engraveWidthMm })}
            />
            <NumberField
              id="engraveHeightMm"
              label="Zonă gravură · înălțime"
              unit="mm"
              value={draft.engraveHeightMm}
              error={err("engraveHeightMm")}
              onValue={(engraveHeightMm) => update({ engraveHeightMm })}
            />
            <NumberField
              id="engraveDepthMm"
              label="Adâncime gravură"
              unit="mm"
              value={draft.engraveDepthMm}
              error={err("engraveDepthMm")}
              onValue={(engraveDepthMm) => update({ engraveDepthMm })}
              hint={ENGRAVING_METHODS[draft.engravingMethod].depthNote}
            />
            <SelectField
              id="visual"
              label="Desen produs"
              value={draft.visual}
              onValue={(visual) => update({ visual })}
              options={VISUAL_KEYS.map((visual) => ({ value: visual, label: VISUAL_LABELS[visual] }))}
              hint="Până la fotografii."
            />
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              Mașina recomandată
              {draft.recommendedMachine !== suggested && (
                <span className="flex items-center gap-2 text-xs text-muted">
                  Pentru {atelier.name} se sugerează {MACHINES[suggested].shortLabel}.
                  <button
                    type="button"
                    onClick={() => update({ recommendedMachine: suggested })}
                    className="font-medium text-ink underline underline-offset-4"
                  >
                    Folosește
                  </button>
                </span>
              )}
            </legend>
            <div className="grid gap-2 xl:grid-cols-3">
              {MACHINE_ORDER.map((machine: Machine) => (
                <ChoiceCard
                  key={machine}
                  name="recommendedMachine"
                  checked={draft.recommendedMachine === machine}
                  onSelect={() => update({ recommendedMachine: machine })}
                  title={MACHINES[machine].shortLabel}
                  detail={MACHINES[machine].role}
                  aside={machine === suggested ? "sugerată" : undefined}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm">Tehnică de gravare</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(ENGRAVING_METHODS) as EngravingMethod[]).map((method) => (
                <ChoiceCard
                  key={method}
                  name="engravingMethod"
                  checked={draft.engravingMethod === method}
                  onSelect={() => update({ engravingMethod: method })}
                  title={ENGRAVING_METHODS[method].label}
                  detail={ENGRAVING_METHODS[method].depthNote}
                />
              ))}
            </div>
          </fieldset>

          <Field id="toolRecommendation" label="Sculă și setări (apare pe fișa de atelier)" error={err("toolRecommendation")}>
            <textarea
              id="toolRecommendation"
              rows={2}
              value={draft.toolRecommendation}
              placeholder="Freză conică din carbură 30°, vârf 0,25 mm · adâncime 0,30 mm în două treceri"
              onChange={(event) => update({ toolRecommendation: event.target.value })}
              aria-invalid={err("toolRecommendation") ? true : undefined}
              aria-describedby={describedBy("toolRecommendation", err("toolRecommendation"))}
              className={cn(inputClass, "h-auto py-2.5")}
            />
          </Field>
        </Section>

        <Section
          id="sectiune-personalizare"
          title="Personalizare"
          description="Limitele configuratorului, potrivite zonei de gravură."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SelectField
              id="maxLines"
              label="Rânduri de text"
              value={String(draft.maxLines)}
              onValue={(value) => update({ maxLines: Number(value) })}
              options={Array.from({ length: MAX_ENGRAVE_LINES }, (_, i) => ({
                value: String(i + 1),
                label: `${i + 1} ${i === 0 ? "rând" : "rânduri"}`,
              }))}
              error={err("maxLines")}
            />
            <NumberField
              id="maxCharsPerLine"
              label="Caractere pe rând"
              value={draft.maxCharsPerLine}
              error={err("maxCharsPerLine")}
              onValue={(maxCharsPerLine) => update({ maxCharsPerLine })}
            />
            <div className="sm:col-span-2">
              <LinesField
                id="sampleEngraving"
                label="Text de exemplu pe desen"
                count={lineCount}
                values={draft.sampleEngraving}
                error={err("sampleEngraving")}
                placeholder={(index) => (index === 0 ? "ex. BRUNO" : "")}
                onValues={(sampleEngraving) => update({ sampleEngraving })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <LinesField
              id="frontLineHints"
              label="Indicații pentru față"
              count={lineCount}
              values={draft.frontLineHints}
              error={err("frontLineHints")}
              hint="Apar ca text de ajutor în câmpurile clientului."
              placeholder={(index) => ["ex. Nume", "ex. Telefon", "ex. Dată sau mesaj"][index] ?? ""}
              onValues={(frontLineHints) => update({ frontLineHints })}
            />
            <div className="grid content-start gap-3">
              <Toggle
                id="backEngravingAvailable"
                label="Se poate grava și pe verso"
                checked={draft.backEngravingAvailable}
                onChange={(backEngravingAvailable) => update({ backEngravingAvailable })}
              />
              {draft.backEngravingAvailable && (
                <>
                  <NumberField
                    id="backEngravingPriceBani"
                    label="Supliment verso"
                    unit="RON"
                    scale={100}
                    value={draft.backEngravingPriceBani}
                    error={err("backEngravingPriceBani")}
                    onValue={(backEngravingPriceBani) => update({ backEngravingPriceBani })}
                  />
                  <LinesField
                    id="backLineHints"
                    label="Indicații pentru verso"
                    count={lineCount}
                    values={draft.backLineHints}
                    error={err("backLineHints")}
                    placeholder={(index) => ["ex. Telefon", "ex. Mesaj", ""][index] ?? ""}
                    onValues={(backLineHints) => update({ backLineHints })}
                  />
                </>
              )}
            </div>
          </div>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm">Simboluri recomandate</legend>
            <div className="flex flex-wrap gap-2">
              {SYMBOL_CATEGORIES.map((category) => {
                const checked = draft.symbolSets.includes(category.key);
                return (
                  <label
                    key={category.key}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm",
                      checked ? "border-ink bg-surface" : "border-line",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        update({
                          symbolSets: checked
                            ? draft.symbolSets.filter((set) => set !== category.key)
                            : [...draft.symbolSets, category.key],
                        })
                      }
                      className="size-4 accent-accent"
                    />
                    {category.label}
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted">
              Clientul poate răsfoi toate simbolurile; prima categorie bifată se deschide implicit
              {draft.symbolSets.length === 0 && " (fără bifă: „Animale”)"}.
            </p>
          </fieldset>
        </Section>

        <Section
          id="sectiune-finisaje"
          title="Materiale și finisaje"
          description="Primul pas al configuratorului. Diferența se adaugă la prețul de bază."
        >
          {err("variants") && (
            <p id="variants-error" role="alert" className="text-sm text-metal-text">
              {err("variants")}
            </p>
          )}
          <div className="grid gap-3">
            <div className="hidden grid-cols-[3.5rem_minmax(0,1.5fr)_minmax(0,1.4fr)_4rem_7.5rem_2.5rem] gap-3 px-1 text-xs text-muted sm:grid">
              <span>Implicit</span>
              <span>Denumire</span>
              <span>Material</span>
              <span>Culoare</span>
              <span>Diferență</span>
              <span />
            </div>
            {draft.variants.map((variant, index) => (
              <div
                key={variantKeys[index]}
                className="grid grid-cols-2 gap-3 rounded-branch border border-line p-3 sm:grid-cols-[3.5rem_minmax(0,1.5fr)_minmax(0,1.4fr)_4rem_7.5rem_2.5rem] sm:items-start sm:border-0 sm:p-0"
              >
                <label className="flex h-10 items-center gap-2 text-sm sm:justify-center">
                  <input
                    type="radio"
                    name="defaultVariant"
                    checked={variant.isDefault}
                    onChange={() => makeDefault(index)}
                    className="size-4 accent-accent"
                  />
                  <span className="sm:sr-only">Implicit</span>
                </label>
                <div className="flex justify-end sm:order-last">
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    disabled={draft.variants.length === 1}
                    aria-label={`Șterge finisajul ${variant.name || index + 1}`}
                    className="flex size-10 items-center justify-center rounded-branch text-muted hover:bg-surface hover:text-ink disabled:opacity-30"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <TextField
                  id={`variants-${index}-name`}
                  label="Denumire"
                  labelClassName="sm:sr-only"
                  className="col-span-2 sm:col-span-1"
                  value={variant.name}
                  placeholder="Alamă Masivă Periată"
                  error={err(`variants.${index}.name`)}
                  onValue={(name) => setVariant(index, { name })}
                />
                <SelectField
                  id={`variants-${index}-material`}
                  label="Material"
                  labelClassName="sm:sr-only"
                  className="col-span-2 sm:col-span-1"
                  value={variant.material}
                  onValue={(material: Material) =>
                    setVariant(index, {
                      material,
                      // Repaint only a swatch still at the previous material's default colour.
                      ...(variant.swatch === MATERIAL_SWATCHES[variant.material] && { swatch: MATERIAL_SWATCHES[material] }),
                    })
                  }
                  options={MATERIALS.map((material) => ({ value: material, label: MATERIAL_LABELS[material] }))}
                />
                <Field
                  id={`variants-${index}-swatch`}
                  label="Culoare"
                  labelClassName="sm:sr-only"
                  error={err(`variants.${index}.swatch`)}
                >
                  <input
                    id={`variants-${index}-swatch`}
                    type="color"
                    value={/^#[0-9a-f]{6}$/.test(variant.swatch) ? variant.swatch : "#b5945b"}
                    onChange={(event) => setVariant(index, { swatch: event.target.value })}
                    className="h-10 w-full cursor-pointer rounded-branch border border-line-strong bg-bg p-1"
                  />
                </Field>
                <NumberField
                  id={`variants-${index}-priceDeltaBani`}
                  label="Diferență"
                  labelClassName="sm:sr-only"
                  unit="RON"
                  scale={100}
                  value={variant.priceDeltaBani}
                  error={err(`variants.${index}.priceDeltaBani`)}
                  onValue={(priceDeltaBani) => setVariant(index, { priceDeltaBani })}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addVariant}
            disabled={draft.variants.length >= 8}
            className="btn btn-ghost min-h-10 w-fit px-4 disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden="true" />
            Adaugă finisaj
          </button>
        </Section>

        <Section
          id="sectiune-volum"
          title="Tranșe de volum"
          description="Reducere la prețul de bază pentru serii (corporate, HoReCa). Fără tranșe = preț fix."
        >
          {err("volumeTiers") && (
            <p role="alert" className="text-sm text-metal-text">
              {err("volumeTiers")}
            </p>
          )}
          {draft.volumeTiers.length > 0 && (
            <div className="grid gap-3">
              {draft.volumeTiers.map((tier, index) => (
                <div
                  key={tierKeys[index]}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-start gap-3 sm:grid-cols-[10rem_10rem_minmax(0,1fr)_2.5rem]"
                >
                  <NumberField
                    id={`volumeTiers-${index}-minQuantity`}
                    label="De la"
                    labelClassName={index > 0 ? "sr-only" : undefined}
                    unit="buc."
                    value={tier.minQuantity}
                    error={err(`volumeTiers.${index}.minQuantity`)}
                    onValue={(minQuantity) => setTier(index, { minQuantity })}
                  />
                  <NumberField
                    id={`volumeTiers-${index}-discountPercent`}
                    label="Reducere"
                    labelClassName={index > 0 ? "sr-only" : undefined}
                    unit="%"
                    value={tier.discountPercent}
                    error={err(`volumeTiers.${index}.discountPercent`)}
                    onValue={(discountPercent) => setTier(index, { discountPercent })}
                  />
                  <p className={cn("hidden h-10 items-center text-sm text-muted sm:flex", index === 0 && "sm:mt-[1.625rem]")}>
                    {unitPrice(tier.discountPercent)} / buc.
                  </p>
                  <button
                    type="button"
                    onClick={() => removeTier(index)}
                    aria-label={`Șterge tranșa ${index + 1}`}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-branch text-muted hover:bg-surface hover:text-ink",
                      index === 0 && "mt-[1.625rem]",
                    )}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addTier}
            disabled={draft.volumeTiers.length >= 6}
            className="btn btn-ghost min-h-10 w-fit px-4 disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden="true" />
            Adaugă tranșă
          </button>
        </Section>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-branch-lg lg:border lg:px-5">
          <p role="status" className="text-sm">
            {pending ? (
              <span className="text-muted">Se salvează…</span>
            ) : formError ? (
              <span className="text-metal-text">{formError}</span>
            ) : errorCount > 0 ? (
              <span className="text-metal-text">
                {errorCount === 1 ? "Un câmp de corectat" : `${errorCount} câmpuri de corectat`}
              </span>
            ) : savedAt && !dirty ? (
              <span className="flex items-center gap-1.5 text-muted">
                <Check className="size-4 text-metal" aria-hidden="true" />
                Salvat. Magazinul afișează deja modificările.
              </span>
            ) : dirty ? (
              <span className="text-muted">Modificări nesalvate</span>
            ) : (
              <span className="text-muted">Nicio modificare</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Link href="/admin/products" className="btn btn-ghost min-h-10 px-4">
              Înapoi
            </Link>
            <button
              type="submit"
              disabled={pending || (productId !== null && !dirty)}
              className="btn btn-primary min-h-10 px-5 disabled:opacity-50"
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {productId ? "Salvează modificările" : "Creează produsul"}
            </button>
          </div>
        </div>
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-6">
        <div data-branch={draft.branch} className="overflow-hidden rounded-branch-lg border border-line bg-bg text-ink">
          <div className="texture flex aspect-square items-center justify-center bg-surface p-4">
            {preview ? (
              <ProductVisual product={preview} showDimensions className="size-full" />
            ) : (
              <p className="max-w-[14rem] text-center text-sm text-muted">
                Completează dimensiunile piesei și ale zonei de gravură pentru desen.
              </p>
            )}
          </div>
          <div className="grid gap-1 p-4">
            <p className="eyebrow text-[10px] text-metal-text">{atelier.name}</p>
            <p className="display text-lg leading-snug">{draft.name || "Produs nou"}</p>
            <p className="text-sm text-muted">{draft.subtitle || "Subtitlu"}</p>
          </div>
        </div>
        <dl className="grid gap-2 rounded-branch-lg border border-line bg-bg p-4 text-sm">
          {[
            ["Preț", Number.isFinite(normalized.priceBani) ? formatRon(normalized.priceBani) : "—"],
            ["Verso", normalized.backEngravingAvailable ? `+${formatRon(normalized.backEngravingPriceBani || 0)}` : "doar față"],
            [
              "Zonă gravură",
              usable(normalized.engraveWidthMm, normalized.engraveHeightMm)
                ? formatMm(normalized.engraveWidthMm, normalized.engraveHeightMm)
                : "—",
            ],
            [
              "Text",
              Number.isFinite(normalized.maxCharsPerLine) ? `${lineCount} × ${normalized.maxCharsPerLine} caractere` : "—",
            ],
            ["Mașină", MACHINES[draft.recommendedMachine].shortLabel],
            ["Tehnică", ENGRAVING_METHODS[draft.engravingMethod].shortLabel],
            [
              "Stoc",
              Number.isFinite(normalized.stockQuantity)
                ? `${normalized.stockQuantity} buc.${normalized.stockQuantity <= normalized.lowStockThreshold ? " · stoc redus" : ""}`
                : "—",
            ],
          ].map(([term, value]) => (
            <div key={term} className="flex justify-between gap-3">
              <dt className="text-muted">{term}</dt>
              <dd className="text-right">{value}</dd>
            </div>
          ))}
        </dl>
        {productId && initial.isActive && (
          <Link
            href={`/${initial.branch}/produs/${initial.slug}`}
            target="_blank"
            className="flex items-center gap-2 text-sm text-muted hover:text-ink"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Vezi pagina din magazin
          </Link>
        )}
      </aside>
    </form>
  );
}
