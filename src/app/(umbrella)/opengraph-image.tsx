import { ATELIERS } from "@/lib/branches";
import { getFeaturedProducts } from "@/lib/server/catalog";
import { OG_SIZE, renderOgImage } from "@/lib/server/og-image";

export const alt = "Maison Gravure — atelier de gravură mecanică";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image() {
  const [signature] = await getFeaturedProducts().catch(() => []);
  return renderOgImage({
    atelier: "umbrella",
    kicker: "Maison Gravure",
    title: "Gravură mecanică, pentru o viață întreagă.",
    detail: ATELIERS.umbrella.seoDescription,
    product: signature,
  });
}
