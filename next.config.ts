import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Resolve metadata before streaming for every visitor, so <title>, canonical, Open Graph and JSON-LD sit in the
  // initial <head> for all crawlers (Bing, social previews, AI crawlers), not only the ones Next.js lists as HTML-only.
  // Metadata comes from the cached catalogue, so the extra wait is negligible.
  htmlLimitedBots: /.*/,
  // Share images read their fonts from disk at request time; make sure serverless bundles ship them.
  outputFileTracingIncludes: {
    "/**/opengraph-image*": ["./assets/og-fonts/*.ttf"],
  },
};

export default nextConfig;
