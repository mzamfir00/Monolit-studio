import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { verifyPassword } from "@/lib/password";

// The portal has exactly one account: the workshop owner, configured through ADMIN_EMAIL and
// ADMIN_PASSWORD_HASH. Failed logins are throttled per client address (in memory, per server process).

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; since: number }>();

export const isAdminConfigured = () =>
  Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && process.env.AUTH_SECRET);

const digest = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest();

function throttled(client: string) {
  const entry = failures.get(client);
  if (!entry || Date.now() - entry.since > WINDOW_MS) return false;
  return entry.count >= MAX_FAILURES;
}

function recordFailure(client: string) {
  const entry = failures.get(client);
  if (!entry || Date.now() - entry.since > WINDOW_MS) failures.set(client, { count: 1, since: Date.now() });
  else entry.count += 1;
}

/** Credentials check behind the Auth.js provider. Returns the owner user, or null. */
export async function verifyOwnerCredentials(credentials: Partial<Record<string, unknown>>, request: Request) {
  const email = typeof credentials.email === "string" ? credentials.email : "";
  const password = typeof credentials.password === "string" ? credentials.password : "";
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const ownerEmail = process.env.ADMIN_EMAIL;
  const ownerHash = process.env.ADMIN_PASSWORD_HASH;
  if (!ownerEmail || !ownerHash || !email || !password || throttled(client)) return null;

  const emailMatches = timingSafeEqual(digest(email), digest(ownerEmail));
  const passwordMatches = await verifyPassword(password, ownerHash);
  if (!emailMatches || !passwordMatches) {
    recordFailure(client);
    return null;
  }
  failures.delete(client);
  return { id: "owner", email: ownerEmail, name: "Proprietar atelier" };
}
