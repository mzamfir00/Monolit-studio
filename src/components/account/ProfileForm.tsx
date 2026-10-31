"use client";

import { startTransition, useActionState, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { Check, Loader2 } from "lucide-react";
import { saveProfile, type ProfileState } from "@/app/(umbrella)/contul-meu/actions";
import type { ProfileField } from "@/lib/account";
import { COUNTIES } from "@/lib/checkout";
import { cn } from "@/lib/format";

const inputClass =
  "h-12 w-full rounded-branch border border-line-strong bg-bg px-4 text-ink placeholder:text-muted aria-invalid:border-metal-text";

export interface ProfileDefaults {
  name: string;
  email: string;
  phone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCounty: string;
  shippingPostalCode: string;
}

function Field({
  name,
  label,
  error,
  className,
  ...props
}: { name: ProfileField; label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={name} className="text-sm">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-metal-text">
          {error}
        </p>
      )}
    </div>
  );
}

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  const errors = state.errors ?? {};
  const value = (field: ProfileField) => state.values?.[field] ?? defaults[field];
  const [county, setCounty] = useState(defaults.shippingCounty);
  // Submitted by hand rather than through <form action>, so React does not reset the form after a rejected save
  // and the customer keeps everything they typed (including the county).
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }
  return (
    <form onSubmit={submit} className="grid gap-10">
      <fieldset className="grid gap-5">
        <legend className="display mb-5 text-2xl">Date de contact</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nume complet" autoComplete="name" required defaultValue={value("name")} error={errors.name} />
          <Field
            name="phone"
            type="tel"
            label="Telefon"
            autoComplete="tel"
            required
            defaultValue={value("phone")}
            error={errors.phone}
          />
          <div className="grid gap-1.5 sm:col-span-2">
            <span className="text-sm">E-mail</span>
            <p className="flex h-12 items-center rounded-branch border border-line bg-surface px-4 text-muted">
              {defaults.email}
            </p>
            <p className="text-xs text-muted">E-mailul contului nu se poate schimba din pagină; scrie-ne dacă ai nevoie.</p>
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="display mb-2 text-2xl">Adresa de livrare implicită</legend>
        <p className="text-sm text-muted">
          Se completează automat la checkout. Lasă câmpurile goale ca să nu păstrezi nicio adresă.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="shippingAddress"
            label="Strada, numărul, bloc, apartament"
            autoComplete="shipping street-address"
            defaultValue={value("shippingAddress")}
            error={errors.shippingAddress}
            className="sm:col-span-2"
          />
          <Field
            name="shippingCity"
            label="Localitate"
            autoComplete="shipping address-level2"
            defaultValue={value("shippingCity")}
            error={errors.shippingCity}
          />
          <div className="grid content-start gap-1.5">
            <label htmlFor="shippingCounty" className="text-sm">
              Județ
            </label>
            <select
              id="shippingCounty"
              name="shippingCounty"
              value={county}
              onChange={(event) => setCounty(event.target.value)}
              autoComplete="shipping address-level1"
              aria-invalid={errors.shippingCounty ? true : undefined}
              className={inputClass}
            >
              <option value="">Alege județul</option>
              {COUNTIES.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
            {errors.shippingCounty && <p className="text-sm text-metal-text">{errors.shippingCounty}</p>}
          </div>
          <Field
            name="shippingPostalCode"
            label="Cod poștal"
            inputMode="numeric"
            maxLength={6}
            autoComplete="shipping postal-code"
            defaultValue={value("shippingPostalCode")}
            error={errors.shippingPostalCode}
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Salvează datele
        </button>
        <p role="status" className="flex items-center gap-2 text-sm text-muted">
          {state.saved && (
            <>
              <Check className="size-4 text-metal" aria-hidden="true" />
              Datele au fost salvate.
            </>
          )}
        </p>
      </div>
    </form>
  );
}
