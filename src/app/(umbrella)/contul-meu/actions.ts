"use server";

import { revalidatePath } from "next/cache";
import { formText, validateProfile, type FieldErrors, type ProfileField } from "@/lib/account";
import { requireCustomer } from "@/lib/server/customer-auth";
import { updateProfile } from "@/lib/server/customers";

export interface ProfileState {
  errors?: FieldErrors<ProfileField>;
  saved?: boolean;
  /** Echoed back so a rejected form keeps what was typed. */
  values?: Partial<Record<ProfileField, string>>;
}

export async function saveProfile(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const customer = await requireCustomer("/contul-meu/profil");
  const { data, errors } = validateProfile(formData);
  if (!data) {
    const fields: ProfileField[] = ["name", "phone", "shippingAddress", "shippingCity", "shippingCounty", "shippingPostalCode"];
    return { errors, values: Object.fromEntries(fields.map((field) => [field, formText(formData, field)])) };
  }
  await updateProfile(customer.id, data);
  revalidatePath("/contul-meu", "layout");
  return { saved: true };
}
