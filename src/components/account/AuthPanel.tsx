"use client";

import { useActionState, useId, useState, type InputHTMLAttributes } from "react";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { forgotPassword, register, signIn, type AuthState, type ResetRequestState } from "@/app/(umbrella)/autentificare/actions";
import { PASSWORD_MIN } from "@/lib/account";
import { cn } from "@/lib/format";

const inputClass =
  "h-12 w-full rounded-branch border border-line-strong bg-bg px-4 text-ink placeholder:text-muted aria-invalid:border-metal-text";

function Field({
  label,
  error,
  hint,
  ...props
}: { label: string; error?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement> & { name: string }) {
  const id = `${useId()}-${props.name}`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={inputClass}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-metal-text">
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

function Submit({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
      {!pending && <ArrowRight className="size-4" aria-hidden="true" />}
    </button>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-branch border border-metal/60 bg-bg px-4 py-3 text-sm">
      {message}
    </p>
  );
}

function SignInForm({ next, onForgot }: { next: string; onForgot: () => void }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={next} />
      <Field name="email" type="email" label="E-mail" autoComplete="email" required defaultValue={state.values?.email} />
      <Field name="password" type="password" label="Parolă" autoComplete="current-password" required />
      <FormError message={state.formError} />
      <Submit pending={pending}>Intră în cont</Submit>
      <button
        type="button"
        onClick={onForgot}
        className="w-fit text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        Ai uitat parola? Primește un link de resetare
      </button>
    </form>
  );
}

function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, {});
  const errors = state.errors ?? {};
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={next} />
      <Field
        name="name"
        label="Nume complet"
        autoComplete="name"
        required
        defaultValue={state.values?.name}
        error={errors.name}
      />
      <Field
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={errors.email}
      />
      <Field
        name="phone"
        type="tel"
        label="Telefon"
        autoComplete="tel"
        placeholder="07xx xxx xxx"
        required
        defaultValue={state.values?.phone}
        error={errors.phone}
        hint="Pentru curier, completat automat la comenzile viitoare."
      />
      <Field
        name="password"
        type="password"
        label="Parolă"
        autoComplete="new-password"
        minLength={PASSWORD_MIN}
        required
        error={errors.password}
        hint={`Minimum ${PASSWORD_MIN} caractere.`}
      />
      <FormError message={state.formError} />
      <Submit pending={pending}>Creează contul</Submit>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [state, action, pending] = useActionState<ResetRequestState, FormData>(forgotPassword, {});
  if (state.sent) {
    return (
      <div className="grid gap-5">
        <MailCheck className="size-8 text-metal" strokeWidth={1.25} aria-hidden="true" />
        <p role="status">
          Dacă există un cont pentru <span className="font-medium">{state.email}</span>, am trimis un link de resetare. Linkul
          este valabil o oră.
        </p>
        {state.devLink && (
          <p className="rounded-branch border border-dashed border-line-strong bg-surface p-4 text-sm">
            Mod dezvoltare (fără serviciu de e-mail):{" "}
            <a href={state.devLink} className="break-all font-medium underline underline-offset-4">
              deschide linkul de resetare
            </a>
          </p>
        )}
        <button type="button" onClick={onBack} className="w-fit text-sm underline underline-offset-4">
          Înapoi la autentificare
        </button>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-5">
      <p className="text-sm text-muted">Scrie e-mailul contului și îți trimitem un link pentru o parolă nouă.</p>
      <Field name="email" type="email" label="E-mail" autoComplete="email" required defaultValue={state.email} />
      <FormError message={state.error} />
      <Submit pending={pending}>Trimite linkul</Submit>
      <button
        type="button"
        onClick={onBack}
        className="w-fit text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        Înapoi la autentificare
      </button>
    </form>
  );
}

type Mode = "autentificare" | "creare" | "resetare";

/** Sign-in / registration tabs, plus the password reset request. */
export function AuthPanel({ initialMode, next }: { initialMode: Mode; next: string }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const tabs: Array<[Exclude<Mode, "resetare">, string]> = [
    ["autentificare", "Autentificare"],
    ["creare", "Creare cont"],
  ];
  return (
    <div className="grid gap-8 rounded-branch-lg border border-line bg-bg p-6 sm:p-9">
      {mode === "resetare" ? (
        <>
          <h2 className="display text-3xl">Resetează parola</h2>
          <ForgotForm onBack={() => setMode("autentificare")} />
        </>
      ) : (
        <>
          <div role="tablist" aria-label="Cont" className="grid grid-cols-2 border-b border-line">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`tab-${key}`}
                aria-selected={mode === key}
                aria-controls={`panel-${key}`}
                onClick={() => setMode(key)}
                className={cn(
                  "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
                  mode === key ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`}>
            {mode === "autentificare" ? (
              <SignInForm next={next} onForgot={() => setMode("resetare")} />
            ) : (
              <RegisterForm next={next} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
