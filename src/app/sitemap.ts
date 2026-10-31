import type { MetadataRoute } from "next";
import { ATELIERS, ATELIER_ORDER } from "@/lib/branches";
import { db } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

// Built per request from the live catalogue, so products added in the admin are listed right away.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ateliers: MetadataRoute.Sitemap = ATELIER_ORDER.map((atelier) => ({
    url: absoluteUrl(ATELIERS[atelier].href),
    changeFrequency: "weekly",
    priority: atelier === "umbrella" ? 1 : 0.9,
  }));

  try {
    const products = await db().product.findMany({
      where: { isActive: true },
      select: { slug: true, branch: true, updatedAt: true },
      orderBy: [{ branch: "asc" }, { sortOrder: "asc" }],
    });
    return [
      ...ateliers,
      ...products.map((product) => ({
        url: absoluteUrl(`${ATELIERS[product.branch].href}/produs/${product.slug}`),
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    // Without the database the atelier pages are still worth listing.
    console.error("Sitemap: catalogue unavailable", error);
    return ateliers;
  }
}
