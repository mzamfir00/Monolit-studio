"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export interface LoginState {
  error?: string;
  /** Echoed back so the e-mail survives React's form reset after a failed attempt. */
  email?: string;
}

/** Only internal admin paths are accepted as the post-login destination. */
function safeDestination(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value : "";
  let path = raw;
  try {
    path = new URL(raw, "http://local").pathname;
  } catch {
    path = "";
  }
  return path.startsWith("/admin") && !path.startsWith("/admin/login") ? path : "/admin";
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeDestination(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        email: String(formData.get("email") ?? ""),
        error:
          error.type === "CredentialsSignin"
            ? "E-mail sau parolă greșită. După 5 încercări greșite, accesul se blochează 15 minute."
            : "Autentificarea a eșuat. Încearcă din nou.",
      };
    }
    throw error;
  }
  return {};
}

export async function logout() {
  await signOut({ redirectTo: "/admin/login" });
}
