"use server";

import { revalidatePath } from "next/cache";
import type { Machine } from "@/generated/prisma/client";
import { AdminActionError, assignMachine, moveOrder, setUrgent, shipOrder } from "@/lib/server/admin";
import { requireAdmin } from "@/lib/server/admin-auth";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

async function run(task: () => Promise<void>): Promise<ActionResult> {
  await requireAdmin();
  try {
    await task();
  } catch (error) {
    if (error instanceof AdminActionError) return { error: error.message };
    console.error("Admin action failed", error);
    return { error: "Operațiunea nu a reușit. Reîncarcă pagina și încearcă din nou." };
  }
  // The customer's tracking page reads the order live; the admin pages are refreshed here.
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function advanceOrder(orderId: string): Promise<ActionResult> {
  return run(() => moveOrder(orderId, 1));
}

export async function revertOrder(orderId: string): Promise<ActionResult> {
  return run(() => moveOrder(orderId, -1));
}

export async function shipOrderAction(orderId: string, _previous: ActionResult, formData: FormData): Promise<ActionResult> {
  return run(() => shipOrder(orderId, String(formData.get("courierName") ?? ""), String(formData.get("awbNumber") ?? "")));
}

export async function assignMachineAction(itemId: string, machine: Machine): Promise<ActionResult> {
  return run(() => assignMachine(itemId, machine));
}

export async function toggleUrgent(orderId: string, urgent: boolean): Promise<ActionResult> {
  return run(() => setUrgent(orderId, urgent));
}
