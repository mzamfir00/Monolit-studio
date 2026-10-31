"use server";

import { redirect } from "next/navigation";
import { formText, normalizeEmail, passwordError, safeNext, validateRegistration, type FieldErrors } from "@/lib/account";
import { endCustomerSession, startCustomerSession } from "@/lib/server/customer-auth";
import {
  authenticateCustomer,
  registerCustomer,
  registrationAllowed,
  requestPasswordReset,
  resetPassword,
} from "@/lib/server/customers";
import { clientAddress, requestOrigin } from "@/lib/server/request-origin";

export interface AuthState {
  errors?: FieldErrors<"name" | "email" | "password" | "phone" | "confirm">;
  formError?: string;
  /** Echoed back so the form keeps what was typed (React resets uncontrolled forms after an action). */
  values?: { name?: string; email?: string; phone?: string };
}

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(formText(formData, "email"));
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  if (!email || !password) return { formError: "Completează e-mailul și parola.", values: { email } };

  const result = await authenticateCustomer(email, password, await clientAddress());
  if (result === "throttled") {
    return { formError: "Prea multe încercări. Așteaptă 15 minute sau resetează parola.", values: { email } };
  }
  if (result === "invalid") return { formError: "E-mail sau parolă greșite.", values: { email } };
  await startCustomerSession(result.id);
  redirect(safeNext(formData.get("next")));
}

export async function register(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const values = { name: formText(formData, "name"), email: formText(formData, "email"), phone: formText(formData, "phone") };
  const { data, errors } = validateRegistration(formData);
  if (!data) return { errors, values };
  if (!(await registrationAllowed(await clientAddress()))) {
    return { formError: "Prea multe conturi create de pe această conexiune. Încearcă mai târziu.", values };
  }
  const created = await registerCustomer(data);
  if ("error" in created) return { errors: { email: created.error }, values };
  await startCustomerSession(created.id);
  redirect(safeNext(formData.get("next")));
}

export interface ResetRequestState {
  sent?: boolean;
  error?: string;
  devLink?: string;
  email?: string;
}

export async function forgotPassword(_previous: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const email = normalizeEmail(formText(formData, "email"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Adresa de e-mail nu pare validă.", email };
  const result = await requestPasswordReset(email, await requestOrigin(), await clientAddress());
  if (result.emailUnavailable) {
    return { error: "Trimiterea e-mailurilor nu este încă activă. Scrie-ne și te ajutăm să-ți recuperezi contul.", email };
  }
  return { sent: true, devLink: result.devLink, email };
}

export async function setNewPassword(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const token = formText(formData, "token");
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const confirm = typeof formData.get("confirm") === "string" ? String(formData.get("confirm")) : "";
  const weak = passwordError(password);
  if (weak) return { errors: { password: weak } };
  if (password !== confirm) return { errors: { confirm: "Parolele nu coincid." } };
  const userId = await resetPassword(token, password);
  if (!userId) return { formError: "Linkul a expirat sau a fost deja folosit. Cere unul nou." };
  await startCustomerSession(userId);
  redirect("/contul-meu?parola=noua");
}

export async function signOut() {
  await endCustomerSession();
  redirect("/");
}
