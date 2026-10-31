// Absolute URLs and shared page metadata (canonical, Open Graph, Twitter) for search engines and link previews.

import type { Metadata } from "next";

export const SITE_NAME = "Maison Gravure";

/**
 * Public origin of the shop: NEXT_PUBLIC_SITE_URL when set (custom domain), otherwise the Vercel production
 * domain, otherwise local development.
 */
export function siteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return new URL(configured);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return new URL(vercel ? `https://${vercel}` : "http://localhost:3000");
}

export const absoluteUrl = (path: string) => new URL(path, siteUrl()).toString();

/**
 * Metadata for an indexable page. Next.js replaces (does not merge) a parent's openGraph object, so every
 * page that sets its own preview repeats the shared fields here.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  /** Canonical path, e.g. "/pet/produs/medalion-hexagonal-alama-masiva". */
  path: string;
  /** Use the title as is, without the "· Atelier" template. */
  absoluteTitle?: boolean;
}): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ro_RO",
      url: path,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Trims a description to what search results show (~160 characters), on a word boundary. */
export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
