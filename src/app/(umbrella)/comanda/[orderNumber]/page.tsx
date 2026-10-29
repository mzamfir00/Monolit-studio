import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Ban, Clock, Cpu, FlaskConical } from "lucide-react";
import { EngravingDetails } from "@/components/engraving/EngravingDetails";
import { OrderTracker } from "@/components/orders/OrderTracker";
import { ATELIERS } from "@/lib/branches";
import { engravingFromOrderItem } from "@/lib/engraving";
import { formatRon } from "@/lib/format";
import { ORDER_NUMBER_PATTERN, findOrderForCustomer, type CustomerOrder } from "@/lib/server/orders";
import { isPaymentSimulationEnabled, isStripeEnabled } from "@/lib/server/payments";
import { refreshFromStripe } from "@/lib/server/stripe-checkout";
import { MACHINES, ORDER_STATUS_LABELS, WORKFLOW_STEPS } from "@/lib/workshop";
import { advanceOrder } from "./actions";
import { OrderLive } from "./OrderLive";
import { OrderLookup } from "./OrderLookup";

export const metadata: Metadata = { title: "Comanda ta", robots: { index: false } };
export const dynamic = "force-dynamic";

function AddressBlock({ title, lines }: { title: string; lines: Array<string | null | undefined> }) {
  return (
    <div className="grid content-start gap-2">
      <h3 className="eyebrow text-muted">{title}</h3>
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

function Headline({ order }: { order: CustomerOrder }) {
  const firstName = order.billingName.split(" ")[0];
  if (order.status === "PENDING_PAYMENT") {
    return (
      <>
        <h1 className="display text-h2">Așteptăm confirmarea plății</h1>
        <p className="flex items-center gap-2 text-muted">
          <Clock className="size-4" aria-hidden="true" />
          Dacă ai plătit, confirmarea de la Stripe ajunge în câteva secunde — pagina se actualizează singură.
        </p>
      </>
    );
  }
  if (order.status === "CANCELLED") {
    return (
      <>
        <h1 className="display text-h2">Comanda a fost anulată</h1>
        <p className="flex items-center gap-2 text-muted">
          <Ban className="size-4" aria-hidden="true" />
          Plata nu a fost finalizată, așa că nicio piesă nu a intrat în producție.
        </p>
      </>
    );
  }
  return (
    <>
      <h1 className="display text-h2">Mulțumim, {firstName}!</h1>
      <p className="max-w-2xl text-muted">
        Comanda ta a intrat în atelier. Fiecare piesă a fost alocată mașinii Gravograph M20 potrivite metalului ei; mai jos poți
        urmări live fiecare etapă.
      </p>
    </>
  );
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ cheie?: string; nou?: string }>;
}) {
  const { orderNumber } = await params;
  const { cheie, nou } = await searchParams;
  if (!ORDER_NUMBER_PATTERN.test(orderNumber)) notFound();

  let order = await findOrderForCustomer(orderNumber, cheie);
  if (!order) return <OrderLookup orderNumber={orderNumber} />;

  // The success redirect can beat the webhook; ask Stripe directly before showing "pending".
  if (order.status === "PENDING_PAYMENT" && order.stripeCheckoutSessionId && isStripeEnabled()) {
    if (await refreshFromStripe(order.stripeCheckoutSessionId)) order = (await findOrderForCustomer(orderNumber, cheie))!;
  }

  const inWorkshop = WORKFLOW_STEPS.some((step) => step.status === order.status);
  const live = order.status !== "SHIPPED" && order.status !== "CANCELLED";
  const nextStep = WORKFLOW_STEPS[WORKFLOW_STEPS.findIndex((step) => step.status === order.status) + 1];
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const company = order.customerType === "COMPANY";

  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:py-16">
      <header className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow text-metal-text">Comanda {order.number}</p>
          <span className="rounded-full border border-line px-3 py-1 text-xs">{ORDER_STATUS_LABELS[order.status]}</span>
          <OrderLive active={live} justPlaced={nou === "1" && order.status !== "CANCELLED"} />
          {order.isSimulated && (
            <span className="flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 py-1 text-xs text-muted">
              <FlaskConical className="size-3.5" aria-hidden="true" />
              Comandă de test · plată simulată
            </span>
          )}
        </div>
        <Headline order={order} />
      </header>

      {inWorkshop && (
        <section
          aria-labelledby="tracking-title"
          className="grid gap-6 rounded-branch-lg border border-line bg-raised p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="tracking-title" className="display text-2xl">
              Drumul piesei prin atelier
            </h2>
            {nextStep && isPaymentSimulationEnabled() && (
              <form action={advanceOrder.bind(null, order.number, order.accessToken)}>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full border border-dashed border-line-strong px-4 py-2 text-xs text-muted hover:text-ink"
                >
                  <FlaskConical className="size-3.5" aria-hidden="true" />
                  Simulează etapa următoare: {nextStep.label}
                </button>
              </form>
            )}
          </div>
          <OrderTracker
            status={order.status}
            events={order.statusEvents}
            courierName={order.courierName}
            awbNumber={order.awbNumber}
          />
        </section>
      )}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section aria-labelledby="items-title" className="grid content-start gap-6">
          <h2 id="items-title" className="display text-2xl">
            {pieces} {pieces === 1 ? "piesă gravată" : "piese gravate"} la comandă
          </h2>
          <ul className="grid divide-y divide-line border-y border-line">
            {order.items.map((item) => {
              const atelier = ATELIERS[item.branch];
              return (
                <li key={item.id} className="grid gap-4 py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid gap-1.5">
                      <span
                        data-branch={item.branch}
                        className="eyebrow w-fit rounded-full border border-line bg-bg px-2 py-0.5 text-[10px] text-ink"
                      >
                        {atelier.shortName}
                      </span>
                      <p className="font-medium">{item.productName}</p>
                      {item.assignedMachine && (
                        <p className="flex items-center gap-1.5 text-xs text-muted">
                          <Cpu className="size-3.5" aria-hidden="true" />
                          {MACHINES[item.assignedMachine].label}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold tabular-nums">{formatRon(item.lineTotalBani)}</p>
                      <p className="text-xs text-muted tabular-nums">
                        {item.quantity} × {formatRon(item.unitPriceBani)}
                        {item.discountPercent > 0 && ` · −${item.discountPercent}%`}
                      </p>
                      {item.setupFeeBani > 0 && (
                        <p className="text-xs text-muted tabular-nums">+ vectorizare {formatRon(item.setupFeeBani)}</p>
                      )}
                    </div>
                  </div>
                  <EngravingDetails config={engravingFromOrderItem(item)} />
                </li>
              );
            })}
          </ul>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatRon(order.subtotalBani)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Livrare prin curier</dt>
              <dd className="tabular-nums">{order.shippingBani === 0 ? "Gratuită" : formatRon(order.shippingBani)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt>{order.paidAt ? "Total plătit cu cardul" : "Total"}</dt>
              <dd className="display text-3xl tabular-nums">{formatRon(order.totalBani)}</dd>
            </div>
          </dl>
        </section>

        <aside className="grid content-start gap-8 rounded-branch-lg border border-line bg-surface p-6 sm:p-8">
          <AddressBlock
            title={company ? "Facturare · persoană juridică" : "Facturare · persoană fizică"}
            lines={[
              company ? order.companyName : order.billingName,
              company ? `CUI ${order.companyCui} · Reg. Com. ${order.companyRegCom}` : null,
              company ? `În atenția: ${order.billingName}` : null,
              order.billingAddress,
              `${order.billingPostalCode} ${order.billingCity}, jud. ${order.billingCounty}`,
            ]}
          />
          <AddressBlock
            title="Livrare"
            lines={[
              order.shippingName,
              order.shippingAddress,
              `${order.shippingPostalCode} ${order.shippingCity}, jud. ${order.shippingCounty}`,
            ]}
          />
          <AddressBlock title="Contact" lines={[order.email, order.phone]} />
          {order.customerNote && <AddressBlock title="Mențiuni pentru atelier" lines={[order.customerNote]} />}
          <p className="border-t border-line pt-6 text-xs text-muted">
            Păstrează linkul acestei pagini: e cheia de urmărire a comenzii. O poți redeschide oricând cu numărul comenzii și
            adresa de e-mail.
          </p>
        </aside>
      </div>

      <Link href="/" className="flex w-fit items-center gap-2 text-sm font-medium hover:underline">
        Înapoi la ateliere
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
