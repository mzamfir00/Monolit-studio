import { ATELIERS, isBranch } from "@/lib/branches";
import { formatMm, formatRon } from "@/lib/format";
import { getProduct } from "@/lib/server/catalog";
import { OG_SIZE, renderOgImage } from "@/lib/server/og-image";
import { MATERIAL_LABELS } from "@/lib/workshop";

export const alt = "Piesă gravată mecanic, Maison Gravure";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ branch: string; slug: string }> }) {
  const { branch, slug } = await params;
  const product = isBranch(branch) ? await getProduct(branch, slug) : undefined;
  if (!product) {
    return renderOgImage({
      atelier: "umbrella",
      kicker: "Maison Gravure",
      title: "Gravură mecanică personalizată",
      detail: ATELIERS.umbrella.tagline,
    });
  }
  return renderOgImage({
    atelier: product.branch,
    kicker: ATELIERS[product.branch].name,
    title: product.name,
    detail: `${MATERIAL_LABELS[product.material]} · ${formatMm(product.widthMm, product.heightMm, product.depthMm)}`,
    price: formatRon(product.priceBani),
    product,
  });
}
