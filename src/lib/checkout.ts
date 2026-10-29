// Checkout form model and validation. Pure (no server imports) so the form can mirror the server's rules;
// the server action is still the authority and re-validates everything it receives.

import { ENGRAVING_FONTS, type EngravingConfig, type EngravingSides, type UploadedSketch } from "./engraving";

export const COUNTIES = [
  "Alba",
  "Arad",
  "Argeș",
  "Bacău",
  "Bihor",
  "Bistrița-Năsăud",
  "Botoșani",
  "Brașov",
  "Brăila",
  "București",
  "Buzău",
  "Caraș-Severin",
  "Călărași",
  "Cluj",
  "Constanța",
  "Covasna",
  "Dâmbovița",
  "Dolj",
  "Galați",
  "Giurgiu",
  "Gorj",
  "Harghita",
  "Hunedoara",
  "Ialomița",
  "Iași",
  "Ilfov",
  "Maramureș",
  "Mehedinți",
  "Mureș",
  "Neamț",
  "Olt",
  "Prahova",
  "Satu Mare",
  "Sălaj",
  "Sibiu",
  "Suceava",
  "Teleorman",
  "Timiș",
  "Tulcea",
  "Vaslui",
  "Vâlcea",
  "Vrancea",
] as const;

export type CustomerType = "INDIVIDUAL" | "COMPANY";

export interface Address {
  name: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
}

export interface CustomerDetails {
  customerType: CustomerType;
  email: string;
  phone: string;
  billing: Address;
  company: { name: string; cui: string; regCom: string } | null;
  shipping: Address;
  customerNote: string | null;
}

export type CheckoutField =
  | "customerType"
  | "email"
  | "phone"
  | "billingName"
  | "billingAddress"
  | "billingCity"
  | "billingCounty"
  | "billingPostalCode"
  | "companyName"
  | "companyCui"
  | "companyRegCom"
  | "shippingName"
  | "shippingAddress"
  | "shippingCity"
  | "shippingCounty"
  | "shippingPostalCode"
  | "customerNote"
  | "acceptTerms";

export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

/** Cod de Identificare Fiscală: 2–10 digits, last one a mod-11 check digit over the key 753217532. */
export function isValidCui(value: string): boolean {
  const digits = value.replace(/^RO/i, "").trim();
  if (!/^\d{2,10}$/.test(digits)) return false;
  const body = digits.slice(0, -1).padStart(9, "0");
  const sum = [...body].reduce((total, digit, i) => total + Number(digit) * Number("753217532"[i]), 0);
  const check = ((sum * 10) % 11) % 10;
  return check === Number(digits.at(-1));
}

/** Registrul Comerțului: legacy J40/1234/2020 or the current ONRC format (e.g. J2024012345400). */
export function isValidRegCom(value: string): boolean {
  const normalized = value.replace(/\s+/g, "").toUpperCase();
  return /^[JFC]\d{1,2}\/\d{1,8}\/(19|20)\d{2}$/.test(normalized) || /^[JFC](19|20)\d{2}\d{6,10}$/.test(normalized);
}

/** Romanian phone numbers as +40XXXXXXXXX, or null when the number is not valid. */
export function normalizePhone(value: string): string | null {
  const compact = value.replace(/[\s().-]/g, "");
  const match = compact.match(/^(?:\+40|0040|0)(\d{9})$/);
  return match ? `+40${match[1]}` : null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type FormSource = { get(name: string): FormDataEntryValue | null };

const text = (form: FormSource, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
};

function readAddress(form: FormSource, prefix: "billing" | "shipping", errors: CheckoutErrors, nameLabel: string): Address {
  const address = {
    name: text(form, `${prefix}Name`),
    address: text(form, `${prefix}Address`),
    city: text(form, `${prefix}City`),
    county: text(form, `${prefix}County`),
    postalCode: text(form, `${prefix}PostalCode`),
  };
  if (address.name.length < 3) errors[`${prefix}Name`] = `Completează ${nameLabel}.`;
  if (address.address.length < 5)
    errors[`${prefix}Address`] = "Completează strada, numărul și, dacă e cazul, blocul și apartamentul.";
  if (address.city.length < 2) errors[`${prefix}City`] = "Completează localitatea.";
  if (!(COUNTIES as readonly string[]).includes(address.county)) errors[`${prefix}County`] = "Alege județul.";
  if (!/^\d{6}$/.test(address.postalCode)) errors[`${prefix}PostalCode`] = "Codul poștal are 6 cifre.";
  return address;
}

export function validateCustomer(form: FormSource): { customer: CustomerDetails | null; errors: CheckoutErrors } {
  const errors: CheckoutErrors = {};
  const customerType: CustomerType = text(form, "customerType") === "COMPANY" ? "COMPANY" : "INDIVIDUAL";
  const company = customerType === "COMPANY";

  const email = text(form, "email").toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) errors.email = "Adresa de e-mail nu pare validă.";
  const phone = normalizePhone(text(form, "phone"));
  if (!phone) errors.phone = "Introdu un număr de telefon românesc, de exemplu 0722 123 456.";

  const billing = readAddress(form, "billing", errors, company ? "persoana de contact" : "numele și prenumele");

  let companyDetails: CustomerDetails["company"] = null;
  if (company) {
    companyDetails = {
      name: text(form, "companyName"),
      cui: text(form, "companyCui").replace(/\s+/g, "").toUpperCase(),
      regCom: text(form, "companyRegCom").replace(/\s+/g, "").toUpperCase(),
    };
    if (companyDetails.name.length < 2) errors.companyName = "Completează denumirea firmei.";
    if (!isValidCui(companyDetails.cui)) errors.companyCui = "CUI-ul nu este valid — verifică cifrele (cu sau fără RO).";
    if (!isValidRegCom(companyDetails.regCom)) errors.companyRegCom = "Formatul corect este J40/1234/2020 sau J2024012345400.";
  }

  const sameShipping = form.get("shippingSame") === "on";
  const shipping = sameShipping ? billing : readAddress(form, "shipping", errors, "numele destinatarului");

  const note = text(form, "customerNote");
  if (note.length > 500) errors.customerNote = "Mențiunile pot avea cel mult 500 de caractere.";
  if (form.get("acceptTerms") !== "on") {
    errors.acceptTerms = "Confirmă că ai înțeles că piesele gravate la comandă nu pot fi returnate.";
  }

  if (Object.keys(errors).length > 0 || !phone) return { customer: null, errors };
  return {
    customer: {
      customerType,
      email,
      phone,
      billing,
      company: companyDetails,
      shipping,
      customerNote: note || null,
    },
    errors,
  };
}

/** One cart line as submitted to checkout; prices are deliberately absent — the server re-prices. */
export interface CheckoutLine {
  slug: string;
  quantity: number;
  engraving: EngravingConfig;
}

const isString = (value: unknown): value is string => typeof value === "string";
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);

function parseSketch(value: unknown): UploadedSketch | null | undefined {
  if (value === null) return null;
  if (typeof value !== "object" || value === undefined) return undefined;
  const sketch = value as Record<string, unknown>;
  if (!isString(sketch.id) || !/^[0-9a-f-]{36}\.(png|jpg|webp|heic|pdf|svg)$/.test(sketch.id)) return undefined;
  if (!isString(sketch.name) || !isString(sketch.type) || typeof sketch.size !== "number") return undefined;
  return { id: sketch.id, name: sketch.name.slice(0, 120), size: sketch.size, type: sketch.type };
}

/** Shape-checks the cart JSON posted by the browser. Business rules are checked later against the catalogue. */
export function parseCheckoutLines(raw: unknown): CheckoutLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50) return null;
  const lines: CheckoutLine[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) return null;
    const { slug, quantity, engraving } = entry as Record<string, unknown>;
    if (!isString(slug) || !Number.isInteger(quantity) || typeof engraving !== "object" || engraving === null) return null;
    const config = engraving as Record<string, unknown>;
    const sides = config.sides as EngravingSides;
    const sketch = parseSketch(config.sketch);
    if (
      !isString(config.variantName) ||
      (sides !== "FRONT" && sides !== "FRONT_AND_BACK") ||
      !ENGRAVING_FONTS.some((font) => font.key === config.fontKey) ||
      !isStringArray(config.frontLines) ||
      !isStringArray(config.backLines) ||
      !(config.symbolKey === null || isString(config.symbolKey)) ||
      sketch === undefined ||
      typeof config.giftPackaging !== "boolean"
    ) {
      return null;
    }
    lines.push({
      slug,
      quantity: quantity as number,
      engraving: {
        variantName: config.variantName,
        sides,
        fontKey: config.fontKey as EngravingConfig["fontKey"],
        frontLines: config.frontLines,
        backLines: config.backLines,
        symbolKey: config.symbolKey as string | null,
        sketch,
        giftPackaging: config.giftPackaging,
      },
    });
  }
  return lines;
}
