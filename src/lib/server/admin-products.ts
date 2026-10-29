import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/prisma";
import type { ProductErrors, ProductInput } from "@/lib/product-schema";
import type { Branch } from "@/lib/types";
import { AdminActionError } from "./admin";
import { productInclude, toCatalogProduct } from "./catalog-db";

// Product & blank inventory manager (Module C). Callers must have checked requireAdmin().

export type ProductListFilter = "active" | "inactive" | "low-stock";

export async function listAdminProducts({ branch, filter, q }: { branch?: Branch; filter?: ProductListFilter; q?: string }) {
  const search = q?.trim();
  const rows = await db().product.findMany({
    where: {
      ...(branch && { branch }),
      ...(filter === "active" && { isActive: true }),
      ...(filter === "inactive" && { isActive: false }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { blankSku: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: { ...productInclude, _count: { select: { orderItems: true } } },
    orderBy: [{ branch: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  const products = rows.map((row) => ({
    id: row.id,
    isActive: row.isActive,
    orderItems: row._count.orderItems,
    product: toCatalogProduct(row),
  }));
  // Prisma cannot compare two columns, so the low-stock filter runs here (the catalogue is small).
  return filter === "low-stock" ? products.filter(({ product }) => product.stockQuantity <= product.lowStockThreshold) : products;
}

export async function getAdminProduct(id: string) {
  const row = await db().product.findUnique({
    where: { id },
    include: { ...productInclude, _count: { select: { orderItems: true } } },
  });
  if (!row) return null;
  const input: ProductInput = { ...toCatalogProduct(row), isActive: row.isActive };
  return { id: row.id, input, orderItems: row._count.orderItems, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

/** Slug and blank SKU are unique across the catalogue; reported per field, like the validator. */
async function uniquenessErrors(input: ProductInput, id: string | null): Promise<ProductErrors> {
  const clashes = await db().product.findMany({
    where: { OR: [{ slug: input.slug }, { blankSku: input.blankSku }], ...(id && { NOT: { id } }) },
    select: { slug: true, blankSku: true, name: true },
  });
  const errors: ProductErrors = {};
  for (const clash of clashes) {
    if (clash.slug === input.slug) errors.slug = `Adresa e folosită deja de „${clash.name}”.`;
    if (clash.blankSku === input.blankSku) errors.blankSku = `Codul e folosit deja de „${clash.name}”.`;
  }
  return errors;
}

/**
 * Creates or replaces a product with its finishes and volume tiers in one transaction.
 * Expects normalised, validated input. Returns the id, or field errors for slug / SKU clashes.
 */
export async function saveProductRecord(
  id: string | null,
  input: ProductInput,
): Promise<{ id: string } | { errors: ProductErrors }> {
  const errors = await uniquenessErrors(input, id);
  if (Object.keys(errors).length > 0) return { errors };

  const { variants, volumeTiers, ...data } = input;
  try {
    const savedId = await db().$transaction(async (tx) => {
      const product = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });
      await tx.productVariant.deleteMany({ where: { productId: product.id } });
      await tx.volumeTier.deleteMany({ where: { productId: product.id } });
      await tx.productVariant.createMany({
        data: variants.map((variant, sortOrder) => ({ ...variant, sortOrder, productId: product.id })),
      });
      if (volumeTiers.length > 0) {
        await tx.volumeTier.createMany({ data: volumeTiers.map((tier) => ({ ...tier, productId: product.id })) });
      }
      return product.id;
    });
    return { id: savedId };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Another save took the slug or SKU between the check and the write.
      if (error.code === "P2002") return { errors: await uniquenessErrors(input, id) };
      if (error.code === "P2025") throw new AdminActionError("Produsul nu mai există.");
    }
    throw error;
  }
}

/** Only products that were never ordered can be deleted; the others are deactivated instead. */
export async function deleteProductRecord(id: string) {
  const ordered = await db().orderItem.count({ where: { productId: id } });
  if (ordered > 0) {
    throw new AdminActionError(
      `Produsul apare în ${ordered} ${ordered === 1 ? "piesă comandată" : "piese comandate"}. Dezactivează-l ca să dispară din magazin.`,
    );
  }
  const { count } = await db().product.deleteMany({ where: { id } });
  if (count === 0) throw new AdminActionError("Produsul nu mai există.");
}

export async function setProductActive(id: string, isActive: boolean) {
  await db().product.update({ where: { id }, data: { isActive } });
}

export async function setProductStock(id: string, stockQuantity: number) {
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 100_000) {
    throw new AdminActionError("Stocul este un număr întreg între 0 și 100.000.");
  }
  await db().product.update({ where: { id }, data: { stockQuantity } });
}
