import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { ProfileData, Registration } from "@/lib/account";
import type { Address } from "@/lib/checkout";
import { hashPassword, verifyPassword } from "@/lib/password";
import { db } from "@/lib/prisma";
import { PAID_STATUSES } from "./admin";
import { hashToken, newToken } from "./customer-auth";
import { isEmailConfigured, passwordResetEmail, sendEmail } from "./email";

// Customer accounts: registration, sign-in, password reset, profile and order history.

// ── Throttling (in memory, per server process, like the owner login) ───────────────────────────────

const WINDOW_MS = 15 * 60 * 1000;
const buckets = new Map<string, { count: number; since: number }>();

function overLimit(key: string, max: number) {
  const entry = buckets.get(key);
  return Boolean(entry && Date.now() - entry.since < WINDOW_MS && entry.count >= max);
}

function hit(key: string) {
  const entry = buckets.get(key);
  if (!entry || Date.now() - entry.since > WINDOW_MS) buckets.set(key, { count: 1, since: Date.now() });
  else entry.count += 1;
}

// ── Registration and sign-in ─────────────────────────────────────────────────────────────────────

export const EMAIL_TAKEN = "Există deja un cont cu acest e-mail. Autentifică-te sau resetează parola.";

/** Creates a customer account. Returns the new user id, or an error for an e-mail already registered. */
export async function registerCustomer(
  data: Registration,
  address?: Pick<Address, "address" | "city" | "county" | "postalCode">,
): Promise<{ id: string } | { error: string }> {
  if (await db().user.findUnique({ where: { email: data.email }, select: { id: true } })) return { error: EMAIL_TAKEN };
  try {
    const user = await db().user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: await hashPassword(data.password),
        ...(address && {
          shippingAddress: address.address,
          shippingCity: address.city,
          shippingCounty: address.county,
          shippingPostalCode: address.postalCode,
        }),
      },
      select: { id: true },
    });
    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: EMAIL_TAKEN };
    throw error;
  }
}

export async function registrationAllowed(client: string) {
  if (overLimit(`register|${client}`, 10)) return false;
  hit(`register|${client}`);
  return true;
}

// Compared against when the e-mail is unknown, so a wrong e-mail takes as long as a wrong password.
let decoyHash: Promise<string> | null = null;

export type SignInResult = { id: string } | "invalid" | "throttled";

export async function authenticateCustomer(email: string, password: string, client: string): Promise<SignInResult> {
  const key = `login|${client}|${email}`;
  if (overLimit(key, 5) || overLimit(`login|${client}`, 30)) return "throttled";
  const user = await db().user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  decoyHash ??= hashPassword("decoy-password-for-timing");
  const valid = await verifyPassword(password, user?.passwordHash ?? (await decoyHash));
  if (!user?.passwordHash || !valid) {
    hit(key);
    hit(`login|${client}`);
    return "invalid";
  }
  buckets.delete(key);
  return { id: user.id };
}

// ── Password reset ───────────────────────────────────────────────────────────────────────────────

const RESET_MINUTES = 60;

export interface ResetRequestResult {
  /** Development only, when no e-mail service is configured: the link to open directly. */
  devLink?: string;
  /** Production without an e-mail service: the request cannot be fulfilled. */
  emailUnavailable?: boolean;
}

/**
 * Sends a one-time link for setting a new password. The answer is the same whether or not the e-mail has an
 * account, so the form cannot be used to discover customers.
 */
export async function requestPasswordReset(email: string, origin: string, client: string): Promise<ResetRequestResult> {
  const development = process.env.NODE_ENV !== "production";
  if (!isEmailConfigured() && !development) return { emailUnavailable: true };
  if (overLimit(`reset|${client}`, 5)) return {};
  hit(`reset|${client}`);

  const user = await db().user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (!user) return {};
  const token = newToken();
  await db().passwordResetToken.create({
    data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) },
  });
  const link = `${origin}/autentificare/resetare?token=${token}`;
  if (!isEmailConfigured()) return { devLink: link };
  try {
    await sendEmail({ to: email, ...passwordResetEmail(user.name, link) });
  } catch (error) {
    console.error("Password reset e-mail failed", error);
  }
  return {};
}

export async function resetTokenIsValid(token: string) {
  const row = await db().passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  return Boolean(row && !row.usedAt && row.expiresAt.getTime() > Date.now());
}

/** Sets the new password, spends the token and signs every browser out. Returns the user id, or null. */
export async function resetPassword(token: string, password: string): Promise<string | null> {
  const row = await db().passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  const passwordHash = await hashPassword(password);
  const { count } = await db().passwordResetToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (count === 0) return null; // spent by a concurrent request
  await db().$transaction([
    db().user.update({ where: { id: row.userId }, data: { passwordHash } }),
    db().passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: new Date() } }),
    db().customerSession.deleteMany({ where: { userId: row.userId } }),
  ]);
  return row.userId;
}

// ── Profile and orders ───────────────────────────────────────────────────────────────────────────

export async function updateProfile(userId: string, data: ProfileData) {
  await db().user.update({ where: { id: userId }, data });
}

/** Fills the saved delivery address (and phone) from an order, only where the account has none yet. */
export async function rememberAddress(userId: string, phone: string, shipping: Address) {
  const user = await db().user.findUnique({ where: { id: userId }, select: { phone: true, shippingAddress: true } });
  if (!user) return;
  await db().user.update({
    where: { id: userId },
    data: {
      ...(!user.phone && { phone }),
      ...(!user.shippingAddress && {
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingCounty: shipping.county,
        shippingPostalCode: shipping.postalCode,
      }),
    },
  });
}

export async function emailRegistered(email: string) {
  return Boolean(await db().user.findUnique({ where: { email }, select: { id: true } }));
}

export async function attachOrderToCustomer(orderId: string, userId: string) {
  await db().order.update({ where: { id: orderId }, data: { userId } });
}

/** Paid orders of one customer, newest first (unpaid checkout attempts stay out of the history). */
export async function customerOrders(userId: string) {
  return db().order.findMany({
    where: { userId, status: { in: PAID_STATUSES } },
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { id: "asc" }, include: { product: { select: { slug: true, branch: true } } } },
    },
  });
}

export type CustomerOrder = Awaited<ReturnType<typeof customerOrders>>[number];

// ── Admin ────────────────────────────────────────────────────────────────────────────────────────

/** Registered customers with their paid order count and lifetime spend (admin only). */
export async function listCustomers(q?: string) {
  const search = q?.trim();
  const [users, totals] = await Promise.all([
    db().user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      select: { id: true, name: true, email: true, phone: true, createdAt: true, shippingCity: true, shippingCounty: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    db().order.groupBy({
      by: ["userId"],
      where: { userId: { not: null }, status: { in: PAID_STATUSES } },
      _count: { _all: true },
      _sum: { totalBani: true },
      _max: { paidAt: true },
    }),
  ]);
  const byUser = new Map(totals.map((row) => [row.userId, row]));
  return users.map((user) => {
    const stats = byUser.get(user.id);
    return {
      ...user,
      orders: stats?._count._all ?? 0,
      spentBani: stats?._sum.totalBani ?? 0,
      lastOrderAt: stats?._max.paidAt ?? null,
    };
  });
}
