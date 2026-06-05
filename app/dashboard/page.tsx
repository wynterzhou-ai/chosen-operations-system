import { CalendarDays, ClipboardCheck, FileText, Receipt, Users, UserRound } from "lucide-react";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    clients,
    employees,
    rosterToday,
    inspections,
    quotations,
    invoices,
    unpaidInvoices
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("rosters").select("id", { count: "exact", head: true }).eq("shift_date", today),
    supabase.from("inspection_reports").select("id", { count: "exact", head: true }),
    supabase.from("quotations").select("id,total,status").order("created_at", { ascending: false }).limit(6),
    supabase.from("invoices").select("id,total,payment_status").order("created_at", { ascending: false }).limit(6),
    supabase.from("invoices").select("total").neq("payment_status", "paid")
  ]);

  const outstanding = unpaidInvoices.data?.reduce((sum, invoice) => sum + Number(invoice.total), 0) ?? 0;

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Operations</p>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Active Clients" value={clients.count ?? 0} icon={Users} />
        <StatCard label="Active Employees" value={employees.count ?? 0} icon={UserRound} />
        <StatCard label="Rosters Today" value={rosterToday.count ?? 0} icon={CalendarDays} />
        <StatCard label="Inspection Reports" value={inspections.count ?? 0} icon={ClipboardCheck} />
        <StatCard label="Recent Quotations" value={quotations.data?.length ?? 0} icon={FileText} />
        <StatCard
          label="Outstanding Invoices"
          value={formatCurrency(outstanding)}
          helper="Unpaid, partial, and overdue"
          icon={Receipt}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-semibold text-ink">Latest Quotations</h2>
          <div className="mt-4 space-y-3">
            {quotations.data?.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between border-b border-line pb-3 text-sm last:border-0">
                <span className="capitalize text-slate-600">{quote.status}</span>
                <span className="font-medium">{formatCurrency(Number(quote.total))}</span>
              </div>
            ))}
            {!quotations.data?.length ? <p className="text-sm text-slate-500">No quotations yet.</p> : null}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="font-semibold text-ink">Latest Invoices</h2>
          <div className="mt-4 space-y-3">
            {invoices.data?.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between border-b border-line pb-3 text-sm last:border-0">
                <span className="capitalize text-slate-600">{invoice.payment_status}</span>
                <span className="font-medium">{formatCurrency(Number(invoice.total))}</span>
              </div>
            ))}
            {!invoices.data?.length ? <p className="text-sm text-slate-500">No invoices yet.</p> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
