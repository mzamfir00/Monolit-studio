"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { advanceOrderForDevelopment, findAccessToken, findOrderForCustomer } from "@/lib/server/orders";
import { isPaymentSimulationEnabled } from "@/lib/server/payments";

export interface LookupState {
  error?: string;
}

/** Order number + checkout e-mail → the tracking link. */
export async function lookupOrder(orderNumber: string, _previous: LookupState, formData: FormData): Promise<LookupState> {
  const email = String(formData.get("email") ?? "");
  const token = await findAccessToken(orderNumber, email);
  if (!token) return { error: "Nu am găsit o comandă cu acest număr și această adresă de e-mail." };
  redirect(`/comanda/${orderNumber}?cheie=${token}`);
}

/** Development only: pushes the order to the next workshop station so tracking can be tested end to end. */
export async function advanceOrder(orderNumber: string, token: string) {
  if (!isPaymentSimulationEnabled()) return;
  const order = await findOrderForCustomer(orderNumber, token);
  if (!order) return;
  await advanceOrderForDevelopment(order.id);
  revalidatePath(`/comanda/${orderNumber}`);
}
