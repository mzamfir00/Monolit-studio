import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or per-customer pages: the workshop portal, APIs, checkout, order tracking and customer accounts.
      disallow: ["/admin", "/api/", "/checkout", "/comanda/", "/contul-meu", "/autentificare"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
