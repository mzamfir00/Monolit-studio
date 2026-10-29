"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeProduct, validateProduct, type ProductErrors } from "@/lib/product-schema";
import { AdminActionError } from "@/lib/server/admin";
import { requireAdmin } from "@/lib/server/admin-auth";
import { deleteProductRecord, saveProductRecord, setProductActive, setProductStock } from "@/lib/server/admin-products";
import { invalidateCatalog } from "@/lib/server/catalog";
import type { ActionResult } from "../actions";

export interface SaveProductResult extends ActionResult {
  errors?: ProductErrors;
}

const FAILED = "Salvarea nu a reușit. Reîncarcă pagina și încearcă din nou.";

/** The storefront reads the catalogue through a tagged cache; the admin pages are refreshed here. */
function refresh() {
  invalidateCatalog();
  revalidatePath("/admin", "layout");
}

async function run(task: () => Promise<void>): Promise<ActionResult> {
  await requireAdmin();
  try {
    await task();
  } catch (error) {
    if (error instanceof AdminActionError) return { error: error.message };
    console.error("Product action failed", error);
    return { error: FAILED };
  }
  refresh();
  return { ok: true };
}

/** Creates (id = null) or updates a product. The draft is re-normalised and re-validated here. */
export async function saveProduct(id: string | null, draft: unknown): Promise<SaveProductResult> {
  await requireAdmin();
  const input = normalizeProduct(draft);
  const errors = validateProduct(input);
  if (Object.keys(errors).length > 0) return { errors };

  let savedId: string;
  try {
    const result = await saveProductRecord(id, input);
    if ("errors" in result) return { errors: result.errors };
    savedId = result.id;
  } catch (error) {
    if (error instanceof AdminActionError) return { error: error.message };
    console.error("Saving product failed", error);
    return { error: FAILED };
  }
  refresh();
  if (!id) redirect(`/admin/products/${savedId}?nou=1`);
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const result = await run(() => deleteProductRecord(id));
  if (result.ok) redirect("/admin/products?sters=1");
  return result;
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  return run(() => setProductActive(id, isActive));
}

export async function updateStock(id: string, stockQuantity: number): Promise<ActionResult> {
  return run(() => setProductStock(id, stockQuantity));
}
