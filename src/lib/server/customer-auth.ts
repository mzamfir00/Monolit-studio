import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";

// Customer sign-in for /contul-meu. Deliberately separate from the admin's Auth.js session: a customer cookie
// can never pass requireAdmin(). The cookie carries a random token; the database keeps only its SHA-256, so a
// leaked database row cannot be replayed, and deleting rows signs browsers out.

export const CUSTOMER_COOKIE = "mg_cont";
const SESSION_DAYS = 30;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

const customerSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  shippingAddress: true,
  shippingCity: true,
  shippingCounty: true,
  shippingPostalCode: true,
  createdAt: true,
} as const;

/** Starts a session for the user and sets the cookie. Call from a server action or route handler only. */
export async function startCustomerSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db().customerSession.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  (await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** The signed-in customer, or null. Cached per request. */
export const currentCustomer = cache(async () => {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const session = await db().customerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, user: { select: customerSelect } },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.user;
});

export type Customer = NonNullable<Awaited<ReturnType<typeof currentCustomer>>>;

/** For account pages: the customer, or a redirect to sign-in that comes back here afterwards. */
export async function requireCustomer(returnTo = "/contul-meu"): Promise<Customer> {
  const customer = await currentCustomer();
  if (!customer) redirect(`/autentificare?next=${encodeURIComponent(returnTo)}`);
  return customer;
}

/** Signs this browser out. Call from a server action. */
export async function endCustomerSession() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) await db().customerSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(CUSTOMER_COOKIE);
}
