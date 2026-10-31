import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, CreditCard, ExternalLink, Truck } from "lucide-react";
import { EngravingDetails } from "@/components/engraving/EngravingDetails";
import { ProductVisual, type VisualEngraving } from "@/components/product/ProductVisual";
import { ATELIERS } from "@/lib/branches";
import { engravingFromOrderItem, getFont, initialsFrom } from "@/lib/engraving";
import { cn, formatRon } from "@/lib/format";
import { getProduct } from "@/lib/server/catalog";
import { requireCustomer } from "@/lib/server/customer-auth";
import { customerOrders, type CustomerOrder } from "@/lib/server/customers";
import { getSymbol } from "@/lib/symbols";
import type { CatalogProduct, OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Comenzile mele" };

/** Workshop stage as the customer reads it. */
const STAGE: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "În așteptarea plății",
  PAID_NEW: "Plătită · în coada atelierului",
  ASSIGNED_TO_M20: "Alocată pe M20",
  ENGRAVING: "În gravare M20",
  FINISHING_ULTRASONIC: "Curățare & lustruire",
  PACKAGING: "Ambalare premium",
  SHIPPED: "Expediată",
  CANCELLED: "Anulată",
};

const date = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric" });

function StagePill({ status }: { status: OrderStatus }) {
  const shipped = status === "SHIPPED";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
        shipped ? "border-accent bg-accent text-accent-ink" : "border-line-strong",
      )}
    >
      {!shipped && <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-metal" />}
      {STAGE[status]}
    </span>
  );
}

function OrderCard({ order, products }: { order: CustomerOrder; products: Map<string, CatalogProduct> }) {
  const tracking = `/comanda/${order.number}?cheie=${order.accessToken}`;
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <details className="group rounded-branch-lg border border-line bg-bg open:border-line-strong">
      <summary className="grid cursor-pointer list-none gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6 [&::-webkit-details-marker]:hidden">
        <div className="grid gap-1.5">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-sm font-semibold">{order.number}</span>
            <span className="text-sm text-muted">{date.format(order.paidAt ?? order.createdAt)}</span>
          </p>
          <p className="text-sm text-muted">
            {pieces} {pieces === 1 ? "piesă" : "piese"} · {order.items.map((item) => item.productName).join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="font-semibold tabular-nums">{formatRon(order.totalBani)}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted">
            <CreditCard className="size-3.5" aria-hidden="true" />
            {order.isSimulated ? "Plată de test" : "Plătit cu cardul"}
          </span>
          <StagePill status={order.status} />
          <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
        </div>
      </summary>

      <div className="grid gap-6 border-t border-line p-5 sm:p-6">
        <ul className="grid gap-6">
          {order.items.map((item) => {
            const config = engravingFromOrderItem(item);
            const font = getFont(config.fontKey);
            const product = item.product ? products.get(`${item.product.branch}/${item.product.slug}`) : undefined;
            const engraving: VisualEngraving = {
              lines: config.frontLines,
              fontFamily: font.cssFamily,
              uppercase: font.uppercase,
              symbol: getSymbol(config.symbolKey),
              initials: initialsFrom(config.frontLines),
            };
            return (
              <li key={item.id} className="grid gap-5 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <div
                  data-branch={item.branch}
                  className="texture aspect-square overflow-hidden rounded-branch border border-line bg-surface"
                >
                  {product ? (
                    <ProductVisual product={product} engraving={engraving} className="size-full" />
                  ) : (
                    <span className="flex size-full items-center justify-center p-3 text-center text-xs text-muted">
                      Piesă retrasă din colecție
                    </span>
                  )}
                </div>
                <div className="grid content-start gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-1.5">
                      <span
                        data-branch={item.branch}
                        className="eyebrow w-fit rounded-full border border-line bg-bg px-2 py-0.5 text-[10px] text-ink"
                      >
                        {ATELIERS[item.branch].name}
                      </span>
                      <p className="font-medium">
                        {item.productName} <span className="text-muted">× {item.quantity}</span>
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">{formatRon(item.lineTotalBani)}</p>
                  </div>
                  <EngravingDetails config={config} />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2">
          <div className="grid gap-1">
            <p className="eyebrow text-muted">Livrare</p>
            <p>{order.shippingName}</p>
            <p className="text-muted">
              {order.shippingAddress}, {order.shippingCity}, jud. {order.shippingCounty}
            </p>
          </div>
          <div className="grid content-start gap-3 sm:justify-items-end">
            {order.status === "SHIPPED" && order.awbNumber && (
              <p className="flex items-center gap-2">
                <Truck className="size-4 text-metal" aria-hidden="true" />
                {order.courierName} · AWB <span className="font-mono">{order.awbNumber}</span>
              </p>
            )}
            <Link href={tracking} className="btn btn-primary min-h-10 w-fit px-4">
              {order.status === "SHIPPED" ? "Urmărește coletul" : "Vezi etapele din atelier"}
              <ExternalLink className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </details>
  );
}

export default async function MyOrdersPage({ searchParams }: { searchParams: Promise<{ parola?: string }> }) {
  const customer = await requireCustomer("/contul-meu/comenzi");
  const [{ parola }, orders] = await Promise.all([searchParams, customerOrders(customer.id)]);

  // Current catalogue entries, for drawing each piece with the customer's engraving.
  const keys = [
    ...new Set(
      orders.flatMap((order) => order.items.map((item) => item.product && `${item.product.branch}/${item.product.slug}`)),
    ),
  ];
  const products = new Map<string, CatalogProduct>();
  await Promise.all(
    keys
      .filter((key): key is string => Boolean(key))
      .map(async (key) => {
        const [branch, slug] = key.split("/") as [CatalogProduct["branch"], string];
        const product = await getProduct(branch, slug);
        if (product) products.set(key, product);
      }),
  );

  return (
    <section aria-labelledby="comenzi-titlu" className="grid gap-6">
      {parola && (
        <p role="status" className="rounded-branch border border-line bg-surface px-4 py-3 text-sm">
          Parola a fost schimbată. Celelalte dispozitive au fost deconectate.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="comenzi-titlu" className="display text-3xl">
          Comenzile mele
        </h2>
        <p className="text-sm text-muted">
          {orders.length} {orders.length === 1 ? "comandă" : "comenzi"}
        </p>
      </div>
      {orders.length === 0 ? (
        <div className="grid gap-5 rounded-branch-lg border border-line bg-surface p-6 sm:p-8">
          <p>Nu ai încă nicio comandă în acest cont.</p>
          <p className="text-sm text-muted">
            Comenzile plasate fără cont nu apar aici: le poți urmări oricând cu numărul comenzii și e-mailul, pe pagina primită la
            finalizarea plății.
          </p>
          <div className="flex flex-wrap gap-2">
            {(["pet", "jewelry", "vault", "corporate"] as const).map((branch) => (
              <Link key={branch} href={ATELIERS[branch].href} className="btn btn-ghost min-h-10 px-4">
                {ATELIERS[branch].shortName}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} products={products} />
          ))}
        </div>
      )}
    </section>
  );
}
