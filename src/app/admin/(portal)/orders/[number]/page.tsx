import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FlaskConical } from "lucide-react";
import { JobSheet } from "@/components/admin/JobSheet";
import { JobSheetDialog } from "@/components/admin/JobSheetDialog";
import { OrderControls } from "@/components/admin/OrderControls";
import { OrderItemRow } from "@/components/admin/OrderItemRow";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDay, formatDayTime } from "@/lib/admin-ui";
import { formatRon } from "@/lib/format";
import { customerName, dueDate, getOrder } from "@/lib/server/admin";
import { ORDER_STATUS_LABELS } from "@/lib/workshop";

export const metadata: Metadata = { title: "Comandă" };

function Block({ title, lines }: { title: string; lines: Array<string | null | undefined | false> }) {
  return (
    <div className="grid content-start gap-1.5">
      <h3 className="eyebrow text-[10px] text-muted">{title}</h3>
      <p className="text-sm leading-relaxed">
        {lines.filter(Boolean).map((line, index) => (
          <span key={index} className="block">
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}

export default async function AdminOrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await getOrder(number);
  if (!order) notFound();
  const due = dueDate(order);
  const company = order.customerType === "COMPANY";

  return (
    <div className="grid gap-8">
      <Link href="/admin/orders" className="flex w-fit items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Toate comenzile
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold">{order.number}</h1>
            <StatusBadge status={order.status} />
            {order.isSimulated && (
              <span className="flex items-center gap-1 rounded-full border border-dashed border-line-strong px-2.5 py-0.5 text-xs text-muted">
                <FlaskConical className="size-3.5" aria-hidden="true" />
                Plată simulată
              </span>
            )}
          </div>
          <p className="text-muted">
            {customerName(order)} · {formatRon(order.totalBani)} · plasată {formatDayTime(order.createdAt)}
            {due && ` · termen ${formatDay(due)}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <JobSheetDialog orderNumber={order.number}>
            <JobSheet order={order} />
          </JobSheetDialog>
          <a
            href={`/comanda/${order.number}?cheie=${order.accessToken}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-branch border border-line-strong bg-bg px-2.5 py-1.5 text-xs hover:border-ink"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            Pagina de urmărire a clientului
          </a>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <section className="grid gap-4 rounded-branch-lg border border-line bg-bg p-5">
            <h2 className="text-sm font-semibold">Piese ({order.items.length})</h2>
            <div className="grid gap-6 divide-y divide-line">
              {order.items.map((item) => (
                <div key={item.id} className="grid gap-2 pt-6 first:pt-0">
                  <OrderItemRow item={item} />
                  <p className="text-right text-xs text-muted tabular-nums">
                    {item.quantity} × {formatRon(item.unitPriceBani)}
                    {item.discountPercent > 0 && ` (−${item.discountPercent}%)`}
                    {item.setupFeeBani > 0 && ` + vectorizare ${formatRon(item.setupFeeBani)}`} = {formatRon(item.lineTotalBani)}
                  </p>
                </div>
              ))}
            </div>
            <dl className="grid gap-1 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatRon(order.subtotalBani)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Livrare</dt>
                <dd className="tabular-nums">{order.shippingBani ? formatRon(order.shippingBani) : "Gratuită"}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatRon(order.totalBani)}</dd>
              </div>
            </dl>
          </section>

          <section className="grid gap-3 rounded-branch-lg border border-line bg-bg p-5">
            <h2 className="text-sm font-semibold">Istoric</h2>
            <ol className="grid gap-2 text-sm">
              {order.statusEvents.map((event) => (
                <li key={event.id} className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3">
                  <span className="tabular-nums text-muted">{formatDayTime(event.createdAt)}</span>
                  <span>
                    {ORDER_STATUS_LABELS[event.status]}
                    {event.note && <span className="text-muted"> — {event.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="grid content-start gap-6">
          <section className="grid gap-3 rounded-branch-lg border border-line bg-bg p-5">
            <h2 className="text-sm font-semibold">Etapa în atelier</h2>
            <OrderControls orderId={order.id} status={order.status} isUrgent={order.isUrgent} />
            {order.awbNumber && (
              <p className="text-sm">
                {order.courierName} · AWB <span className="font-mono">{order.awbNumber}</span>
              </p>
            )}
          </section>
          <section className="grid gap-5 rounded-branch-lg border border-line bg-surface p-5">
            <Block
              title={company ? "Facturare · persoană juridică" : "Facturare · persoană fizică"}
              lines={[
                company && order.companyName,
                company && `CUI ${order.companyCui}`,
                company && `Reg. Com. ${order.companyRegCom}`,
                company ? `Contact: ${order.billingName}` : order.billingName,
                order.billingAddress,
                `${order.billingPostalCode} ${order.billingCity}, jud. ${order.billingCounty}`,
              ]}
            />
            <Block
              title="Livrare"
              lines={[
                order.shippingName,
                order.shippingAddress,
                `${order.shippingPostalCode} ${order.shippingCity}, jud. ${order.shippingCounty}`,
              ]}
            />
            <Block title="Contact" lines={[order.email, order.phone]} />
            <Block
              title="Plată"
              lines={[
                order.paidAt ? `Card · ${formatDayTime(order.paidAt)}` : "Neplătită",
                order.isSimulated
                  ? "Simulată în dezvoltare"
                  : order.stripePaymentIntentId && `Stripe ${order.stripePaymentIntentId}`,
              ]}
            />
            {order.customerNote && <Block title="Mențiunile clientului" lines={[order.customerNote]} />}
          </section>
        </aside>
      </div>
    </div>
  );
}
