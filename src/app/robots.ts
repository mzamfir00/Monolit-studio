import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or per-customer pages: the workshop portal, APIs, checkout and order tracking.
      disallow: ["/admin", "/api/", "/checkout", "/comanda/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
