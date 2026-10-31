"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { setNewPassword, type AuthState } from "@/app/(umbrella)/autentificare/actions";
import { PASSWORD_MIN } from "@/lib/account";

const inputClass =
  "h-12 w-full rounded-branch border border-line-strong bg-bg px-4 text-ink placeholder:text-muted aria-invalid:border-metal-text";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(setNewPassword, {});
  const errors = state.errors ?? {};
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      {(
        [
          ["password", "Parola nouă", errors.password, `Minimum ${PASSWORD_MIN} caractere.`],
          ["confirm", "Repetă parola", errors.confirm, undefined],
        ] as const
      ).map(([name, label, error, hint]) => (
        <div key={name} className="grid gap-1.5">
          <label htmlFor={name} className="text-sm">
            {label}
          </label>
          <input
            id={name}
            name={name}
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? `${name}-note` : undefined}
            className={inputClass}
          />
          {(error || hint) && (
            <p id={`${name}-note`} className={error ? "text-sm text-metal-text" : "text-xs text-muted"}>
              {error ?? hint}
            </p>
          )}
        </div>
      ))}
      {state.formError && (
        <p role="alert" className="rounded-branch border border-metal/60 bg-bg px-4 py-3 text-sm">
          {state.formError}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Salvează parola și intră în cont
      </button>
    </form>
  );
}
