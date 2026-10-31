import type { Metadata } from "next";
import { Search } from "lucide-react";
import { displayPhone } from "@/lib/account";
import { formatDay } from "@/lib/admin-ui";
import { formatRon } from "@/lib/format";
import { requireAdmin } from "@/lib/server/admin-auth";
import { listCustomers } from "@/lib/server/customers";

export const metadata: Metadata = { title: "Clienți înregistrați" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;
  const customers = await listCustomers(q);
  const buyers = customers.filter((customer) => customer.orders > 0).length;
  const lifetime = customers.reduce((sum, customer) => sum + customer.spentBani, 0);

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <p className="eyebrow text-metal-text">Conturi · istoric · valoare</p>
          <h1 className="display text-h2">Clienți înregistrați</h1>
          <p className="text-sm text-muted">
            {customers.length} {customers.length === 1 ? "cont" : "conturi"} · {buyers} cu comenzi plătite · {formatRon(lifetime)}{" "}
            în total
          </p>
        </div>
        <form role="search" className="flex items-center gap-2">
          <label className="relative">
            <span className="sr-only">Caută client</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Nume, e-mail sau telefon"
              className="h-10 w-72 max-w-full rounded-branch border border-line-strong bg-bg pl-9 pr-3 text-sm"
            />
          </label>
          <button type="submit" className="btn btn-ghost min-h-10">
            Caută
          </button>
        </form>
      </header>

      <div className="relative overflow-x-auto rounded-branch-lg border border-line bg-bg">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs text-muted">
            <tr>
              {["Client", "E-mail", "Telefon", "Comenzi plătite", "Valoare totală", "Ultima comandă", "Cont creat"].map(
                (heading) => (
                  <th key={heading} scope="col" className="px-4 py-3 font-medium">
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  {q ? "Niciun client pentru căutarea aceasta." : "Niciun cont de client încă."}
                </td>
              </tr>
            )}
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{customer.name}</p>
                  {customer.shippingCity && (
                    <p className="text-xs text-muted">
                      {customer.shippingCity}, jud. {customer.shippingCounty}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <a href={`mailto:${customer.email}`} className="hover:underline">
                    {customer.email}
                  </a>
                </td>
                <td className="px-4 py-3 tabular-nums">{customer.phone ? displayPhone(customer.phone) : "—"}</td>
                <td className="px-4 py-3 tabular-nums">{customer.orders}</td>
                <td className="px-4 py-3 font-semibold tabular-nums">
                  {customer.spentBani ? formatRon(customer.spentBani) : "—"}
                </td>
                <td className="px-4 py-3 text-muted">{customer.lastOrderAt ? formatDay(customer.lastOrderAt) : "—"}</td>
                <td className="px-4 py-3 text-muted">{formatDay(customer.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Valoarea totală adună comenzile plătite (inclusiv livrarea) plasate din cont. Comenzile fără cont nu sunt atribuite
        clienților.
      </p>
    </div>
  );
}
