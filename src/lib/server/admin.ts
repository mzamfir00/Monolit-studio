import "server-only";
import type { Machine, OrderStatus, Prisma } from "@/generated/prisma/client";
import { parseBlankSpec, type BlankSpec } from "@/lib/blank-spec";
import { db } from "@/lib/prisma";
import type { Branch, ProductVisualKey } from "@/lib/types";
import { BRANCHES } from "@/lib/types";
import { MACHINE_ORDER, WORKFLOW_STEPS } from "@/lib/workshop";

/** Paid and still in the workshop. */
export const ACTIVE_STATUSES = ["PAID_NEW", "ASSIGNED_TO_M20", "ENGRAVING", "FINISHING_ULTRASONIC", "PACKAGING"] as const;
export type ActiveStatus = (typeof ACTIVE_STATUSES)[number];
export const PAID_STATUSES: OrderStatus[] = [...ACTIVE_STATUSES, "SHIPPED"];
const FLOW: OrderStatus[] = WORKFLOW_STEPS.map((step) => step.status);

const itemProductSelect = {
  id: true,
  slug: true,
  visual: true,
  material: true,
  blankSku: true,
  widthMm: true,
  heightMm: true,
  depthMm: true,
  weightGrams: true,
  engraveWidthMm: true,
  engraveHeightMm: true,
  engraveDepthMm: true,
  engravingMethod: true,
  toolRecommendation: true,
  recommendedMachine: true,
  leadTimeDays: true,
} satisfies Prisma.ProductSelect;

export const adminOrderInclude = {
  items: { orderBy: { id: "asc" }, include: { product: { select: itemProductSelect } } },
  statusEvents: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude;

export type AdminOrder = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>;
export type AdminOrderItem = AdminOrder["items"][number];

/** Spec of the blank the item was sold on: the order-time snapshot, or the current product for older orders. */
export function specForItem(item: AdminOrderItem): BlankSpec | null {
  const snapshot = parseBlankSpec(item.blankSpec);
  if (snapshot) return snapshot;
  const product = item.product;
  if (!product) return null;
  return { ...product, visual: product.visual as ProductVisualKey };
}

export const customerName = (order: { customerType: string; companyName: string | null; billingName: string }) =>
  order.customerType === "COMPANY" && order.companyName ? order.companyName : order.billingName;

/** Paid date + the longest lead time of the order's pieces, counted in working days. */
export function dueDate(order: AdminOrder): Date | null {
  if (!order.paidAt) return null;
  const days = Math.max(3, ...order.items.map((item) => item.product?.leadTimeDays ?? 0));
  const due = new Date(order.paidAt);
  for (let added = 0; added < days;) {
    due.setDate(due.getDate() + 1);
    if (due.getDay() !== 0 && due.getDay() !== 6) added++;
  }
  return due;
}

// ── Production queue ────────────────────────────────────────────────────────────────────────────

export interface QueueFilters {
  machine?: Machine;
  status?: OrderStatus;
}

const SHIPPED_WINDOW_DAYS = 14;

export async function getProductionQueue({ machine, status }: QueueFilters): Promise<AdminOrder[]> {
  const shippedSince = new Date(Date.now() - SHIPPED_WINDOW_DAYS * 86_400_000);
  const statusWhere: Prisma.OrderWhereInput = status
    ? { status, ...(status === "SHIPPED" && { shippedAt: { gte: shippedSince } }) }
    : { OR: [{ status: { in: [...ACTIVE_STATUSES] } }, { status: "SHIPPED", shippedAt: { gte: shippedSince } }] };
  return db().order.findMany({
    where: { ...statusWhere, ...(machine && { items: { some: { assignedMachine: machine } } }) },
    include: adminOrderInclude,
    orderBy: [{ isUrgent: "desc" }, { paidAt: "asc" }],
  });
}

/** Piece counts per machine and per station, for the queue's filter chips. */
export async function getQueueCounts() {
  const items = await db().orderItem.findMany({
    where: { order: { status: { in: [...ACTIVE_STATUSES] } } },
    select: { assignedMachine: true, quantity: true, order: { select: { status: true } } },
  });
  const byMachine = Object.fromEntries(MACHINE_ORDER.map((key) => [key, 0])) as Record<Machine, number>;
  const byStatus = Object.fromEntries(ACTIVE_STATUSES.map((key) => [key, 0])) as Record<ActiveStatus, number>;
  for (const item of items) {
    if (item.assignedMachine) byMachine[item.assignedMachine] += item.quantity;
    byStatus[item.order.status as ActiveStatus] += item.quantity;
  }
  return { byMachine, byStatus };
}

// ── Orders ──────────────────────────────────────────────────────────────────────────────────────

export async function getOrder(number: string): Promise<AdminOrder | null> {
  return db().order.findUnique({ where: { number }, include: adminOrderInclude });
}

export async function getOrderByItem(itemId: string) {
  const item = await db().orderItem.findUnique({ where: { id: itemId }, select: { order: { include: adminOrderInclude } } });
  return item?.order ?? null;
}

export async function listOrders({ status, q }: { status?: OrderStatus; q?: string }) {
  const search = q?.trim();
  return db().order.findMany({
    where: {
      ...(status ? { status } : { status: { not: "PENDING_PAYMENT" } }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { billingName: { contains: search, mode: "insensitive" } },
          { companyName: { contains: search, mode: "insensitive" } },
          { awbNumber: { contains: search } },
        ],
      }),
    },
    include: { items: { select: { branch: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

// ── Dashboard ───────────────────────────────────────────────────────────────────────────────────

export async function getDashboard({ days, includeTest }: { days: number | null; includeTest: boolean }) {
  const since = days ? new Date(Date.now() - days * 86_400_000) : undefined;
  const paidWhere: Prisma.OrderWhereInput = {
    status: { in: PAID_STATUSES },
    ...(since && { paidAt: { gte: since } }),
    ...(!includeTest && { isSimulated: false }),
  };

  const [totals, testOrders, branchRows, activeItems, activeOrders, products, recent] = await Promise.all([
    db().order.aggregate({ where: paidWhere, _sum: { totalBani: true }, _count: true }),
    db().order.count({ where: { ...paidWhere, isSimulated: true } }),
    db().orderItem.groupBy({ by: ["branch"], where: { order: paidWhere }, _sum: { lineTotalBani: true, quantity: true } }),
    db().orderItem.findMany({
      where: { order: { status: { in: [...ACTIVE_STATUSES] }, ...(!includeTest && { isSimulated: false }) } },
      select: { assignedMachine: true, quantity: true, order: { select: { status: true } } },
    }),
    db().order.findMany({
      where: { status: { in: [...ACTIVE_STATUSES] }, ...(!includeTest && { isSimulated: false }) },
      include: adminOrderInclude,
      orderBy: { paidAt: "asc" },
    }),
    db().product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, blankSku: true, stockQuantity: true, lowStockThreshold: true },
      orderBy: { stockQuantity: "asc" },
    }),
    db().order.findMany({
      where: { status: { not: "PENDING_PAYMENT" }, ...(!includeTest && { isSimulated: false }) },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        number: true,
        createdAt: true,
        status: true,
        totalBani: true,
        isSimulated: true,
        customerType: true,
        companyName: true,
        billingName: true,
      },
    }),
  ]);

  const byBranch = BRANCHES.map((branch) => {
    const row = branchRows.find((candidate) => candidate.branch === branch);
    return { branch: branch as Branch, revenueBani: row?._sum.lineTotalBani ?? 0, pieces: row?._sum.quantity ?? 0 };
  });

  const machines = MACHINE_ORDER.map((machine) => {
    const byStatus = Object.fromEntries(ACTIVE_STATUSES.map((status) => [status, 0])) as Record<ActiveStatus, number>;
    for (const item of activeItems) {
      if (item.assignedMachine === machine) byStatus[item.order.status as ActiveStatus] += item.quantity;
    }
    return { machine, byStatus, pieces: Object.values(byStatus).reduce((sum, value) => sum + value, 0) };
  });

  const now = Date.now();
  const urgent = activeOrders
    .map((order) => ({ order, due: dueDate(order) }))
    .filter(({ order, due }) => order.isUrgent || (due && due.getTime() - now < 86_400_000))
    .slice(0, 8);

  return {
    since,
    totals: {
      revenueBani: totals._sum.totalBani ?? 0,
      orders: totals._count,
      averageBani: totals._count ? Math.round((totals._sum.totalBani ?? 0) / totals._count) : 0,
      piecesInProduction: activeItems.reduce((sum, item) => sum + item.quantity, 0),
      ordersInProduction: activeOrders.length,
      testOrders,
    },
    byBranch,
    machines,
    urgent,
    lowStock: products.filter((product) => product.stockQuantity <= product.lowStockThreshold),
    recent,
  };
}

// ── Mutations (callers must have checked requireAdmin) ─────────────────────────────────────────

export class AdminActionError extends Error {}

/** Moves a paid order one station forward or back. Shipping goes through shipOrder (it needs an AWB). */
export async function moveOrder(orderId: string, direction: 1 | -1) {
  const order = await db().order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { select: { assignedMachine: true } } },
  });
  const index = FLOW.indexOf(order.status);
  const target = FLOW[index + direction];
  if (index < 0 || !target) throw new AdminActionError("Comanda nu poate fi mutată din această etapă.");
  if (target === "SHIPPED") throw new AdminActionError("Pentru expediere introdu curierul și AWB-ul.");
  if (target === "ASSIGNED_TO_M20" && order.items.some((item) => !item.assignedMachine)) {
    throw new AdminActionError("Alocă fiecare piesă unei mașini M20 înainte de a continua.");
  }
  await db().order.update({
    where: { id: orderId, status: order.status },
    data: {
      status: target,
      ...(order.status === "SHIPPED" && { shippedAt: null }),
      statusEvents: { create: { status: target, note: direction === -1 ? "Readus la etapa anterioară" : null } },
    },
  });
}

export async function shipOrder(orderId: string, courierName: string, awbNumber: string) {
  const courier = courierName.trim();
  const awb = awbNumber.replace(/\s+/g, "");
  if (courier.length < 2) throw new AdminActionError("Alege curierul.");
  if (!/^[A-Za-z0-9-]{6,30}$/.test(awb))
    throw new AdminActionError("AWB-ul are între 6 și 30 de caractere (litere, cifre, cratimă).");
  const { count } = await db().order.updateMany({
    where: { id: orderId, status: "PACKAGING" },
    data: { status: "SHIPPED", courierName: courier, awbNumber: awb, shippedAt: new Date() },
  });
  if (count === 0) throw new AdminActionError("Doar comenzile aflate în ambalare pot fi expediate.");
  await db().orderStatusEvent.create({ data: { orderId, status: "SHIPPED", note: `${courier} · AWB ${awb}` } });
}

export async function assignMachine(itemId: string, machine: Machine) {
  if (!MACHINE_ORDER.includes(machine)) throw new AdminActionError("Mașină necunoscută.");
  await db().orderItem.update({ where: { id: itemId }, data: { assignedMachine: machine } });
}

export async function setUrgent(orderId: string, urgent: boolean) {
  await db().order.update({ where: { id: orderId }, data: { isUrgent: urgent } });
}
