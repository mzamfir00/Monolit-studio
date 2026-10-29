"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { Building2, CreditCard, FlaskConical, Loader2, Lock, ShoppingBag, User } from "lucide-react";
import { EngravingDetails } from "@/components/engraving/EngravingDetails";
import { ATELIERS } from "@/lib/branches";
import { COUNTIES, type CheckoutErrors, type CheckoutField, type CustomerType } from "@/lib/checkout";
import { cn, formatRon } from "@/lib/format";
import { FREE_SHIPPING_FROM_BANI, shippingFor } from "@/lib/pricing";
import { cartSubtotal, lineQuote, useCartStore, useHydrated } from "@/store/useCartStore";
import { placeOrder, type CheckoutState } from "./actions";

const inputClass =
  "h-12 w-full rounded-branch border border-line-strong bg-bg px-4 text-ink placeholder:text-muted aria-invalid:border-metal-text";

function Field({
  name,
  label,
  error,
  hint,
  className,
  ...props
}: { name: CheckoutField; label: string; error?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={name} className="text-sm">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={inputClass}
        {...props}
      />
      {error ? (
        <p id={`${name}-error`} className="text-sm text-metal-text">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${name}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function CountySelect({ name, error, autoComplete }: { name: CheckoutField; error?: string; autoComplete: string }) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={name} className="text-sm">
        Județ
      </label>
      <select
        id={name}
        name={name}
        required
        defaultValue=""
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass}
      >
        <option value="" disabled>
          Alege județul
        </option>
        {COUNTIES.map((county) => (
          <option key={county} value={county}>
            {county}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${name}-error`} className="text-sm text-metal-text">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  const id = `checkout-step-${index}`;
  return (
    <fieldset aria-labelledby={id} className="grid gap-5 border-t border-line pt-8">
      <div className="flex items-baseline gap-4">
        <span aria-hidden="true" className="font-mono text-xs text-metal-text">
          {String(index).padStart(2, "0")}
        </span>
        <h2 id={id} className="display text-2xl">
          {title}
        </h2>
      </div>
      {children}
    </fieldset>
  );
}

function AddressFields({
  prefix,
  errors,
  nameLabel,
  addressLabel,
}: {
  prefix: "billing" | "shipping";
  errors: CheckoutErrors;
  nameLabel: string;
  addressLabel: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        name={`${prefix}Name`}
        label={nameLabel}
        autoComplete={`${prefix} name`}
        required
        error={errors[`${prefix}Name`]}
        className="sm:col-span-2"
      />
      <Field
        name={`${prefix}Address`}
        label={addressLabel}
        placeholder="Strada, numărul, bloc, scară, apartament"
        autoComplete={`${prefix} street-address`}
        required
        error={errors[`${prefix}Address`]}
        className="sm:col-span-2"
      />
      <Field
        name={`${prefix}City`}
        label="Localitate"
        autoComplete={`${prefix} address-level2`}
        required
        error={errors[`${prefix}City`]}
      />
      <CountySelect name={`${prefix}County`} autoComplete={`${prefix} address-level1`} error={errors[`${prefix}County`]} />
      <Field
        name={`${prefix}PostalCode`}
        label="Cod poștal"
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        autoComplete={`${prefix} postal-code`}
        required
        error={errors[`${prefix}PostalCode`]}
      />
    </div>
  );
}

export function CheckoutForm({
  stripeEnabled,
  simulationEnabled,
  cancelledOrder,
}: {
  stripeEnabled: boolean;
  simulationEnabled: boolean;
  cancelledOrder: string | null;
}) {
  const hydrated = useHydrated();
  const items = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.open);
  const [customerType, setCustomerType] = useState<CustomerType>("INDIVIDUAL");
  const [sameShipping, setSameShipping] = useState(true);
  const [state, setState] = useState<CheckoutState>({});
  const [pending, startTransition] = useTransition();
  const [intent, setIntent] = useState<"stripe" | "simulate" | null>(null);

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const errors = state.errors ?? {};
  const company = customerType === "COMPANY";

  /** A field's server error disappears as soon as the customer edits that field. */
  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name as CheckoutField;
    if (state.errors?.[name]) setState((previous) => ({ ...previous, errors: { ...previous.errors, [name]: undefined } }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const formData = new FormData(event.currentTarget, submitter);
    setIntent(submitter?.value === "simulate" ? "simulate" : "stripe");
    startTransition(async () => {
      const result = await placeOrder(formData);
      if (!result) return;
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
        return;
      }
      setState(result);
      requestAnimationFrame(() => {
        const invalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        (invalid ?? document.getElementById("checkout-error"))?.scrollIntoView({ behavior: "smooth", block: "center" });
        invalid?.focus({ preventScroll: true });
      });
    });
  }

  if (!hydrated) {
    return <div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-14 sm:px-6" aria-busy="true" />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="grid max-w-2xl gap-3">
        <p className="eyebrow text-metal-text">Finalizarea comenzii</p>
        <h1 className="display text-h2">Comanda ta</h1>
        <p className="text-muted">
          Piesele se gravează după confirmarea plății, pe mașina M20 potrivită fiecărui metal. Vei putea urmări live fiecare etapă
          din atelier.
        </p>
      </header>

      {cancelledOrder && (
        <p role="status" className="mt-8 rounded-branch border border-line bg-surface px-5 py-4 text-sm">
          Plata pentru comanda <span className="font-mono">{cancelledOrder}</span> a fost anulată. Coșul tău este păstrat — poți
          încerca din nou oricând.
        </p>
      )}

      {items.length === 0 ? (
        <div className="mt-12 grid max-w-xl gap-6 rounded-branch-lg border border-line bg-surface p-8">
          <ShoppingBag className="size-8 text-metal" strokeWidth={1.25} aria-hidden="true" />
          <p>Coșul tău este gol. Alege o piesă și configureaz-o înainte de a finaliza comanda.</p>
          <div className="flex flex-wrap gap-2">
            {(["pet", "jewelry", "vault", "corporate"] as const).map((branch) => (
              <Link key={branch} href={ATELIERS[branch].href} className="btn btn-ghost">
                {ATELIERS[branch].shortName}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          <form onSubmit={onSubmit} onInput={clearFieldError} className="grid content-start gap-10">
            <input
              type="hidden"
              name="cart"
              value={JSON.stringify(items.map(({ slug, quantity, engraving }) => ({ slug, quantity, engraving })))}
            />
            <input type="hidden" name="expectedTotal" value={total} />

            <Section index={1} title="Date de contact">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  name="email"
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  required
                  error={errors.email}
                  hint="Pentru confirmarea comenzii și AWB."
                />
                <Field
                  name="phone"
                  label="Telefon"
                  type="tel"
                  autoComplete="tel"
                  placeholder="07xx xxx xxx"
                  required
                  error={errors.phone}
                  hint="Pentru curier."
                />
              </div>
            </Section>

            <Section index={2} title="Facturare">
              <div role="radiogroup" aria-label="Tip client" className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["INDIVIDUAL", "Persoană fizică", "Factură pe numele tău", User],
                    ["COMPANY", "Persoană juridică", "Factură pe firmă, cu CUI", Building2],
                  ] as const
                ).map(([value, label, detail, Icon]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-branch border border-line bg-bg px-4 py-3 transition-colors hover:border-line-strong has-checked:border-ink has-checked:bg-surface has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
                  >
                    <input
                      type="radio"
                      name="customerType"
                      value={value}
                      checked={customerType === value}
                      onChange={() => setCustomerType(value)}
                      className="sr-only"
                    />
                    <Icon className="size-5 shrink-0 text-metal" strokeWidth={1.5} aria-hidden="true" />
                    <span className="grid">
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted">{detail}</span>
                    </span>
                  </label>
                ))}
              </div>

              {company && (
                <div className="grid gap-4 rounded-branch border border-line bg-raised p-4 sm:grid-cols-2 sm:p-5">
                  <Field
                    name="companyName"
                    label="Denumirea firmei"
                    autoComplete="organization"
                    required
                    error={errors.companyName}
                    className="sm:col-span-2"
                  />
                  <Field
                    name="companyCui"
                    label="CUI / CIF"
                    placeholder="RO12345678"
                    autoCapitalize="characters"
                    required
                    error={errors.companyCui}
                  />
                  <Field
                    name="companyRegCom"
                    label="Nr. Reg. Com."
                    placeholder="J40/1234/2020"
                    autoCapitalize="characters"
                    required
                    error={errors.companyRegCom}
                  />
                </div>
              )}

              <AddressFields
                prefix="billing"
                errors={errors}
                nameLabel={company ? "Persoană de contact" : "Nume și prenume"}
                addressLabel={company ? "Sediul social" : "Adresa de facturare"}
              />
            </Section>

            <Section index={3} title="Livrare">
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="shippingSame"
                  checked={sameShipping}
                  onChange={(event) => setSameShipping(event.target.checked)}
                  className="size-5 accent-[var(--b-accent)]"
                />
                Livrez la adresa de facturare
              </label>
              {!sameShipping && (
                <AddressFields prefix="shipping" errors={errors} nameLabel="Destinatar" addressLabel="Adresa de livrare" />
              )}
              <p className="text-sm text-muted">
                Curier rapid cu AWB în toată România · {shipping === 0 ? "gratuit pentru această comandă" : formatRon(shipping)}.
                Livrare gratuită de la {formatRon(FREE_SHIPPING_FROM_BANI)}.
              </p>
            </Section>

            <Section index={4} title="Mențiuni pentru atelier">
              <div className="grid gap-1.5">
                <label htmlFor="customerNote" className="text-sm">
                  Opțional
                </label>
                <textarea
                  id="customerNote"
                  name="customerNote"
                  rows={3}
                  maxLength={500}
                  aria-invalid={errors.customerNote ? true : undefined}
                  placeholder="De exemplu: termen dorit pentru un eveniment, detalii despre schița încărcată."
                  className="w-full rounded-branch border border-line-strong bg-bg px-4 py-3 text-ink placeholder:text-muted"
                />
                {errors.customerNote && <p className="text-sm text-metal-text">{errors.customerNote}</p>}
              </div>
            </Section>

            <Section index={5} title="Plata">
              <div className="flex gap-4 rounded-branch border border-line bg-surface p-5">
                <CreditCard className="mt-0.5 size-6 shrink-0 text-metal" strokeWidth={1.5} aria-hidden="true" />
                <div className="grid gap-1.5 text-sm">
                  <p className="font-medium">Exclusiv cu cardul, pe pagina securizată Stripe</p>
                  <p className="text-muted">
                    Nu oferim plata ramburs: o piesă gravată pe numele tău nu mai poate fi revândută dacă nu este ridicată.
                    Producția începe doar după confirmarea plății, iar datele cardului nu ajung niciodată la noi.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  required
                  aria-invalid={errors.acceptTerms ? true : undefined}
                  className="mt-0.5 size-5 shrink-0 accent-[var(--b-accent)]"
                />
                <span>
                  Am verificat textul gravurii și înțeleg că piesele personalizate sunt exceptate de la dreptul de retragere (OUG
                  34/2014, art. 16 lit. c).
                </span>
              </label>
              {errors.acceptTerms && <p className="-mt-3 text-sm text-metal-text">{errors.acceptTerms}</p>}

              {state.formError && (
                <p id="checkout-error" role="alert" className="rounded-branch border border-metal/60 bg-bg px-4 py-3 text-sm">
                  {state.formError}
                </p>
              )}

              <div className="grid gap-3">
                <button
                  type="submit"
                  name="intent"
                  value="stripe"
                  disabled={pending || !stripeEnabled}
                  className="btn btn-primary w-full disabled:opacity-50"
                >
                  {pending && intent === "stripe" ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Lock className="size-4" aria-hidden="true" />
                  )}
                  Plătește cu cardul · {formatRon(total)}
                </button>
                {!stripeEnabled && (
                  <p className="text-center text-xs text-muted">
                    Plata Stripe nu este configurată pe acest server (STRIPE_SECRET_KEY lipsește).
                  </p>
                )}
                {simulationEnabled && (
                  <div className="grid gap-2 rounded-branch border border-dashed border-line-strong p-4">
                    <button
                      type="submit"
                      name="intent"
                      value="simulate"
                      disabled={pending}
                      className="btn btn-ghost w-full disabled:opacity-50"
                    >
                      {pending && intent === "simulate" ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <FlaskConical className="size-4" aria-hidden="true" />
                      )}
                      Simulează plata (dezvoltare)
                    </button>
                    <p className="text-center text-xs text-muted">
                      Salvează comanda ca plătită, fără Stripe, ca să poți testa fluxul complet. Indisponibil cu chei Stripe live.
                    </p>
                  </div>
                )}
              </div>
            </Section>
          </form>

          <aside aria-labelledby="summary-title" className="lg:sticky lg:top-16 lg:self-start">
            <div className="grid gap-5 rounded-branch-lg border border-line bg-surface p-6 sm:p-7">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="summary-title" className="display text-2xl">
                  Sumarul comenzii
                </h2>
                <button
                  type="button"
                  onClick={openCart}
                  className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  Modifică coșul
                </button>
              </div>
              <ul className="grid divide-y divide-line border-y border-line lg:max-h-[52vh] lg:overflow-y-auto lg:pr-2">
                {items.map((item) => {
                  const quote = lineQuote(item);
                  const atelier = ATELIERS[item.branch];
                  return (
                    <li key={item.id} className="grid gap-3 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="grid gap-1.5">
                          <span
                            data-branch={item.branch}
                            className="eyebrow w-fit rounded-full border border-line bg-bg px-2 py-0.5 text-[10px] text-ink"
                          >
                            {atelier.shortName}
                          </span>
                          <p className="font-medium">{item.name}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold tabular-nums">{formatRon(quote.totalBani)}</p>
                          <p className="text-xs text-muted tabular-nums">
                            {item.quantity} × {formatRon(quote.unitBani)}
                            {quote.discountPercent > 0 && ` · −${quote.discountPercent}%`}
                          </p>
                          {quote.setupFeeBani > 0 && (
                            <p className="text-xs text-muted tabular-nums">+ vectorizare {formatRon(quote.setupFeeBani)}</p>
                          )}
                        </div>
                      </div>
                      <EngravingDetails config={item.engraving} />
                    </li>
                  );
                })}
              </ul>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tabular-nums">{formatRon(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Livrare prin curier</dt>
                  <dd className="tabular-nums">{shipping === 0 ? "Gratuită" : formatRon(shipping)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <dt>Total de plată</dt>
                  <dd className="display text-3xl tabular-nums">{formatRon(total)}</dd>
                </div>
              </dl>
              <p className="flex items-center gap-2 text-xs text-muted">
                <Lock className="size-3.5 shrink-0" aria-hidden="true" />
                Prețurile sunt recalculate și verificate de server înainte de plată.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
