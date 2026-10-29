import "server-only";
import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { access } from "node:fs/promises";
import path from "node:path";
import { Prisma, type OrderStatus } from "@/generated/prisma/client";
import { blankSpecOf } from "@/lib/blank-spec";
import type { CheckoutLine, CustomerDetails } from "@/lib/checkout";
import { charCount, sanitizeLine, validateEngraving } from "@/lib/engraving";
import { formatRon } from "@/lib/format";
import { linePricing, quoteLine, shippingFor, type LineQuote } from "@/lib/pricing";
import { db } from "@/lib/prisma";
import type { CatalogProduct } from "@/lib/types";
import { WORKFLOW_STEPS, machineForBranch } from "@/lib/workshop";
import { loadProducts } from "./catalog-db";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");

export interface PricedLine extends CheckoutLine {
  productId: string;
  product: CatalogProduct;
  quote: LineQuote;
}

export interface PendingOrder {
  id: string;
  number: string;
  accessToken: string;
  email: string;
  lines: PricedLine[];
  subtotalBani: number;
  shippingBani: number;
  totalBani: number;
}

export class CheckoutError extends Error {}

// No 0/O/1/I, so numbers survive being read out over the phone.
const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ORDER_NUMBER_PATTERN = /^MG-\d{4}-[A-HJ-NP-Z2-9]{6}$/;

function orderNumber() {
  const suffix = Array.from({ length: 6 }, () => ORDER_ALPHABET[randomInt(ORDER_ALPHABET.length)]).join("");
  return `MG-${new Date().getFullYear()}-${suffix}`;
}

async function sketchExists(id: string) {
  try {
    await access(path.join(UPLOAD_DIR, path.basename(id)));
    return true;
  } catch {
    return false;
  }
}

/** Re-prices and re-validates every line against the database; client prices are never trusted. */
async function priceLines(lines: CheckoutLine[]): Promise<PricedLine[]> {
  const products = await loadProducts(lines.map((line) => line.slug));
  const ordered = new Map<string, number>();
  const priced: PricedLine[] = [];

  for (const line of lines) {
    const stored = products.get(line.slug);
    if (!stored) throw new CheckoutError("Unul dintre produse nu mai este disponibil. Elimină-l din coș și încearcă din nou.");
    const { product } = stored;
    const engraving = {
      ...line.engraving,
      frontLines: line.engraving.frontLines.map((value) => value.trim()),
      backLines: line.engraving.sides === "FRONT_AND_BACK" ? line.engraving.backLines.map((value) => value.trim()) : [],
    };
    const tampered = [...engraving.frontLines, ...engraving.backLines].some(
      (value) => sanitizeLine(value, product.maxCharsPerLine) !== value || charCount(value) > product.maxCharsPerLine,
    );
    const errors = validateEngraving(product, engraving, line.quantity);
    if (tampered || Object.keys(errors).length > 0) {
      throw new CheckoutError(
        errors.quantity ??
          `Gravura pentru „${product.name}” nu mai respectă limitele piesei. Reconfigureaz-o din pagina produsului.`,
      );
    }
    if (engraving.sketch && !(await sketchExists(engraving.sketch.id))) {
      throw new CheckoutError(`Schița pentru „${product.name}” nu mai există pe server. Încarc-o din nou din pagina produsului.`);
    }
    const total = (ordered.get(product.slug) ?? 0) + line.quantity;
    if (total > product.stockQuantity) {
      throw new CheckoutError(
        `Avem doar ${product.stockQuantity} semifabricate pentru „${product.name}”. Ajustează cantitatea din coș.`,
      );
    }
    ordered.set(product.slug, total);
    priced.push({
      ...line,
      engraving,
      productId: stored.id,
      product,
      quote: quoteLine(linePricing(product, engraving), line.quantity),
    });
  }
  return priced;
}

/** Creates the order in PENDING_PAYMENT; it enters the workshop queue only through markOrderPaid. */
export async function createPendingOrder(
  customer: CustomerDetails,
  lines: CheckoutLine[],
  expectedTotalBani: number,
): Promise<PendingOrder> {
  const priced = await priceLines(lines);
  const subtotalBani = priced.reduce((sum, line) => sum + line.quote.totalBani, 0);
  const shippingBani = shippingFor(subtotalBani);
  const totalBani = subtotalBani + shippingBani;
  if (totalBani !== expectedTotalBani) {
    // The cart's price snapshot is out of date (catalogue changed since the items were added).
    throw new CheckoutError(
      `Prețurile din atelier s-au actualizat: totalul corect este ${formatRon(totalBani)}. Elimină și readaugă piesele din coș pentru a vedea noile prețuri.`,
    );
  }
  const accessToken = randomBytes(24).toString("base64url");

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const order = await db().order.create({
        data: {
          number: orderNumber(),
          accessToken,
          customerType: customer.customerType,
          email: customer.email,
          phone: customer.phone,
          billingName: customer.billing.name,
          billingAddress: customer.billing.address,
          billingCity: customer.billing.city,
          billingCounty: customer.billing.county,
          billingPostalCode: customer.billing.postalCode,
          companyName: customer.company?.name,
          companyCui: customer.company?.cui,
          companyRegCom: customer.company?.regCom,
          shippingName: customer.shipping.name,
          shippingAddress: customer.shipping.address,
          shippingCity: customer.shipping.city,
          shippingCounty: customer.shipping.county,
          shippingPostalCode: customer.shipping.postalCode,
          customerNote: customer.customerNote,
          subtotalBani,
          shippingBani,
          totalBani,
          items: {
            create: priced.map(({ product, productId, quantity, quote, engraving }) => ({
              productId,
              branch: product.branch,
              productName: product.name,
              variantName: engraving.variantName,
              blankSku: product.blankSku,
              quantity,
              unitPriceBani: quote.unitBani,
              discountPercent: quote.discountPercent,
              setupFeeBani: quote.setupFeeBani,
              lineTotalBani: quote.totalBani,
              engravingSides: engraving.sides,
              fontKey: engraving.fontKey,
              frontLines: engraving.frontLines,
              backLines: engraving.backLines,
              symbolKey: engraving.symbolKey,
              customUploadUrl: engraving.sketch?.id,
              sketchName: engraving.sketch?.name,
              giftPackaging: engraving.giftPackaging,
              blankSpec: { ...blankSpecOf(product) },
            })),
          },
          statusEvents: { create: { status: "PENDING_PAYMENT" } },
        },
        select: { id: true, number: true },
      });
      return { ...order, accessToken, email: customer.email, lines: priced, subtotalBani, shippingBani, totalBani };
    } catch (error) {
      const numberTaken = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!numberTaken) throw error;
    }
  }
  throw new Error("Could not allocate a unique order number.");
}

export async function attachCheckoutSession(orderId: string, sessionId: string) {
  await db().order.update({ where: { id: orderId }, data: { stripeCheckoutSessionId: sessionId } });
}

/**
 * Payment confirmed (Stripe webhook, success-page check or dev simulation): PENDING_PAYMENT → PAID_NEW, every
 * line assigned to its product's recommended M20, blanks taken out of stock. Idempotent — a second call no-ops.
 */
export async function markOrderPaid(orderId: string, options: { paymentIntentId?: string; simulated?: boolean } = {}) {
  return db().$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING_PAYMENT" },
      data: {
        status: "PAID_NEW",
        paidAt: new Date(),
        isSimulated: options.simulated ?? false,
        stripePaymentIntentId: options.paymentIntentId,
      },
    });
    if (count === 0) return false;

    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { id: true, branch: true, quantity: true, productId: true, product: { select: { recommendedMachine: true } } },
    });
    for (const item of items) {
      await tx.orderItem.update({
        where: { id: item.id },
        data: { assignedMachine: item.product?.recommendedMachine ?? machineForBranch(item.branch) },
      });
      if (item.productId) {
        await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { decrement: item.quantity } } });
      }
    }
    await tx.orderStatusEvent.create({
      data: {
        orderId,
        status: "PAID_NEW",
        note: options.simulated ? "Plată simulată (mediu de dezvoltare)" : "Plată cu cardul confirmată de Stripe",
      },
    });
    return true;
  });
}

/** Releases an unpaid order (Stripe session expired or could not be created). */
export async function cancelPendingOrder(orderId: string, note: string) {
  const { count } = await db().order.updateMany({
    where: { id: orderId, status: "PENDING_PAYMENT" },
    data: { status: "CANCELLED" },
  });
  if (count > 0) await db().orderStatusEvent.create({ data: { orderId, status: "CANCELLED", note } });
}

const sameSecret = (a: string, b: string) => {
  const [left, right] = [Buffer.from(a), Buffer.from(b)];
  return left.length === right.length && timingSafeEqual(left, right);
};

const customerOrderInclude = {
  items: { orderBy: { id: "asc" } },
  statusEvents: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude;

export type CustomerOrder = Prisma.OrderGetPayload<{ include: typeof customerOrderInclude }>;

/** The order behind a tracking link, or null when the number or the secret does not match. */
export async function findOrderForCustomer(number: string, token: string | undefined): Promise<CustomerOrder | null> {
  if (!ORDER_NUMBER_PATTERN.test(number) || !token) return null;
  const order = await db().order.findUnique({ where: { number }, include: customerOrderInclude });
  return order && sameSecret(order.accessToken, token) ? order : null;
}

/** Recovers the tracking secret from the order number + the e-mail used at checkout. */
export async function findAccessToken(number: string, email: string): Promise<string | null> {
  if (!ORDER_NUMBER_PATTERN.test(number)) return null;
  const order = await db().order.findUnique({ where: { number }, select: { email: true, accessToken: true } });
  return order && sameSecret(order.email, email.trim().toLowerCase()) ? order.accessToken : null;
}

const WORKSHOP_FLOW: OrderStatus[] = WORKFLOW_STEPS.map((step) => step.status);

/** Development tool: moves a paid order one station along the workshop line. */
export async function advanceOrderForDevelopment(orderId: string) {
  const order = await db().order.findUnique({ where: { id: orderId }, select: { status: true } });
  const index = order ? WORKSHOP_FLOW.indexOf(order.status) : -1;
  if (index < 0 || index === WORKSHOP_FLOW.length - 1) return;
  const next = WORKSHOP_FLOW[index + 1];
  const shipped = next === "SHIPPED";
  await db().order.update({
    where: { id: orderId },
    data: {
      status: next,
      ...(shipped && {
        courierName: "FAN Courier (test)",
        awbNumber: String(randomInt(1e9, 1e10)),
        shippedAt: new Date(),
      }),
      statusEvents: { create: { status: next, note: "Avansat manual (simulare)" } },
    },
  });
}
