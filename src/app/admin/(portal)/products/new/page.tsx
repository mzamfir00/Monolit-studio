import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { isBranch } from "@/lib/branches";
import { emptyProduct, type ProductInput } from "@/lib/product-schema";
import { getAdminProduct } from "@/lib/server/admin-products";

export const metadata: Metadata = { title: "Produs nou" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ atelier?: string; din?: string }> }) {
  const params = await searchParams;
  const source = params.din ? await getAdminProduct(params.din) : null;
  // "Duplică" starts from an existing product: same blank family, new address and SKU, hidden until saved and checked.
  const initial: ProductInput = source
    ? {
        ...source.input,
        name: `${source.input.name} (copie)`,
        slug: `${source.input.slug}-copie`,
        blankSku: `${source.input.blankSku}-COPIE`,
        isActive: false,
        isFeatured: false,
        stockQuantity: 0,
      }
    : emptyProduct(params.atelier && isBranch(params.atelier) ? params.atelier : "pet");

  return (
    <div className="grid gap-8">
      <header className="grid gap-3">
        <Link href="/admin/products" className="flex w-fit items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Toate produsele
        </Link>
        <p className="eyebrow text-metal-text">{source ? `Copie după ${source.input.name}` : "Catalog"}</p>
        <h1 className="display text-h2">Produs nou</h1>
      </header>
      <ProductForm productId={null} initial={initial} />
    </div>
  );
}
