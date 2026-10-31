// Customer account rules shared by the forms and the server actions (the server always re-validates).

import { COUNTIES, normalizePhone } from "./checkout";

export const PASSWORD_MIN = 6;
const PASSWORD_MAX = 200;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type FormSource = { get(name: string): FormDataEntryValue | null };

export const formText = (form: FormSource, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
};

/** Raw password: never trimmed or collapsed, a space is a valid character. */
const formSecret = (form: FormSource, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export function passwordError(password: string): string | undefined {
  if (password.length < PASSWORD_MIN) return `Parola are cel puțin ${PASSWORD_MIN} caractere.`;
  if (password.length > PASSWORD_MAX) return `Parola are cel mult ${PASSWORD_MAX} de caractere.`;
  return undefined;
}

export type RegistrationField = "name" | "email" | "password" | "phone";
export type FieldErrors<F extends string> = Partial<Record<F, string>>;

export interface Registration {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export function validateRegistration(form: FormSource): { data: Registration | null; errors: FieldErrors<RegistrationField> } {
  const errors: FieldErrors<RegistrationField> = {};
  const name = formText(form, "name");
  const email = normalizeEmail(formText(form, "email"));
  const password = formSecret(form, "password");
  const phone = normalizePhone(formText(form, "phone"));
  if (name.length < 3 || name.length > 120) errors.name = "Scrie numele complet.";
  if (!EMAIL.test(email) || email.length > 200) errors.email = "Adresa de e-mail nu pare validă.";
  const weak = passwordError(password);
  if (weak) errors.password = weak;
  if (!phone) errors.phone = "Introdu un număr de telefon românesc, de exemplu 0722 123 456.";
  if (Object.keys(errors).length > 0 || !phone) return { data: null, errors };
  return { data: { name, email, password, phone }, errors };
}

export type ProfileField = "name" | "phone" | "shippingAddress" | "shippingCity" | "shippingCounty" | "shippingPostalCode";

export interface ProfileData {
  name: string;
  phone: string;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingCounty: string | null;
  shippingPostalCode: string | null;
}

/** Profile and default delivery address. The address is optional, but if any part is given, all of it is. */
export function validateProfile(form: FormSource): { data: ProfileData | null; errors: FieldErrors<ProfileField> } {
  const errors: FieldErrors<ProfileField> = {};
  const name = formText(form, "name");
  const phone = normalizePhone(formText(form, "phone"));
  const address = {
    shippingAddress: formText(form, "shippingAddress"),
    shippingCity: formText(form, "shippingCity"),
    shippingCounty: formText(form, "shippingCounty"),
    shippingPostalCode: formText(form, "shippingPostalCode"),
  };
  if (name.length < 3 || name.length > 120) errors.name = "Scrie numele complet.";
  if (!phone) errors.phone = "Introdu un număr de telefon românesc, de exemplu 0722 123 456.";

  const anyAddress = Object.values(address).some(Boolean);
  if (anyAddress) {
    if (address.shippingAddress.length < 5 || address.shippingAddress.length > 200) {
      errors.shippingAddress = "Completează strada, numărul și, dacă e cazul, blocul și apartamentul.";
    }
    if (address.shippingCity.length < 2 || address.shippingCity.length > 80) errors.shippingCity = "Completează localitatea.";
    if (!(COUNTIES as readonly string[]).includes(address.shippingCounty)) errors.shippingCounty = "Alege județul.";
    if (!/^\d{6}$/.test(address.shippingPostalCode)) errors.shippingPostalCode = "Codul poștal are 6 cifre.";
  }
  if (Object.keys(errors).length > 0 || !phone) return { data: null, errors };
  return {
    data: {
      name,
      phone,
      shippingAddress: anyAddress ? address.shippingAddress : null,
      shippingCity: anyAddress ? address.shippingCity : null,
      shippingCounty: anyAddress ? address.shippingCounty : null,
      shippingPostalCode: anyAddress ? address.shippingPostalCode : null,
    },
    errors,
  };
}

/** "+40722123456" → "0722 123 456", for prefilling forms. */
export function displayPhone(phone: string | null | undefined): string {
  const match = phone?.match(/^\+40(\d{3})(\d{3})(\d{3})$/);
  return match ? `0${match[1]} ${match[2]} ${match[3]}` : (phone ?? "");
}

/** Same-site path to continue to after signing in; anything else falls back to the account page. */
export function safeNext(value: unknown, fallback = "/contul-meu"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  try {
    const url = new URL(value, "http://local");
    if (url.origin !== "http://local" || url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
