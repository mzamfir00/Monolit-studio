import { ATELIERS, isBranch } from "@/lib/branches";
import { getProduct, getProductsByBranch } from "@/lib/server/catalog";
import { OG_SIZE, renderOgImage } from "@/lib/server/og-image";

export const alt = "Atelier Maison Gravure";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const atelier = ATELIERS[isBranch(branch) ? branch : "umbrella"];
  const product = isBranch(branch)
    ? ((await getProduct(branch, atelier.heroProductSlug!)) ?? (await getProductsByBranch(branch))[0])
    : undefined;
  return renderOgImage({
    atelier: atelier.key,
    kicker: atelier.name,
    title: atelier.seoTitle,
    detail: atelier.tagline,
    product,
  });
}
