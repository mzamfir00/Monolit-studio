import "server-only";
import { headers } from "next/headers";

/** Origin for links sent outside the site (Stripe return URLs, password reset e-mails). */
export async function requestOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/** Client address for throttling, from the proxy header. */
export async function clientAddress(): Promise<string> {
  const incoming = await headers();
  return incoming.get("x-forwarded-for")?.split(",")[0]?.trim() || incoming.get("x-real-ip") || "local";
}
