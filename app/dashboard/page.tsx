import { CalendarDays, ClipboardCheck, FileText, ListChecks, Receipt, ShieldAlert, UserCheck, UserRound, UserX, Users, WalletCards } from "lucide-react";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [
    clients,
    employees,
    rosterToday,
    checkedInToday,
    notCheckedOutToday,
    pendingChecklistIssues,
    draftPayrollPeriods,
    approvedPayrollPeriods,
    complianceEmployees,
    inspections,
    quotations,
    invoices,
    unpaidInvoices
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("rosters").select("id", { count: "exact", head: true }).eq("shift_date", today),
    supabase
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .gte("check_in_time", today)
      .lt("check_in_time", tomorrow),
    supabase
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .eq("status", "checked_in")
      .gte("check_in_time", today)
      .lt("check_in_time", tomorrow),
    supabase.from("checklist_submissions").select("id", { count: "exact", head: true }).eq("status", "issue"),
    supabase.from("payroll_periods").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("payroll_periods").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("employees").select("*").eq("status", "active"),
    supabase.from("inspection_reports").select("id", { count: "exact", head: true }),
    supabase.from("quotations").select("id,total,status").order("created_at", { ascending: false }).limit(6),
    supabase.from("invoices").select("id,total,payment_status").order("created_at", { ascending: false }).limit(6),
    supabase.from("invoices").select("total").neq("payment_status", "paid")
  ]);

  const outstanding = unpaidInvoices.data?.reduce((sum, invoice) => sum + Number(invoice.total), 0) ?? 0;
  const latestPayrollPeriod = await supabase.from("payroll_periods").select("id").order("start_date", { ascending: false }).limit(1).maybeSingle();
  const latestPayrollRecords = latestPayrollPeriod.data?.id
    ? await supabase.from("payroll_records").select("employer_cost").eq("payroll_period_id", latestPayrollPeriod.data.id)
    : { data: [] as { employer_cost: number }[] };
  const latestEmployerCost = latestPayrollRecords.data?.reduce((sum, record) => sum + Number(record.employer_cost), 0) ?? 0;
  const complianceAlertCounts = getComplianceAlertCounts(complianceEmployees.data ?? []);

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
        <StatCard label="Checked-in Today" value={checkedInToday.count ?? 0} icon={UserCheck} />
        <StatCard label="Not Checked-out Today" value={notCheckedOutToday.count ?? 0} icon={UserX} />
        <StatCard label="Pending Checklist Issues" value={pendingChecklistIssues.count ?? 0} icon={ListChecks} />
        <StatCard label="Draft Payroll Periods" value={draftPayrollPeriods.count ?? 0} icon={WalletCards} />
        <StatCard label="Approved Payroll Periods" value={approvedPayrollPeriods.count ?? 0} icon={WalletCards} />
        <StatCard label="Latest Payroll Employer Cost" value={formatCurrency(latestEmployerCost)} icon={WalletCards} />
        <StatCard label="Compliance 30 Days" value={complianceAlertCounts.days30} icon={ShieldAlert} />
        <StatCard label="Compliance 60 Days" value={complianceAlertCounts.days60} icon={ShieldAlert} />
        <StatCard label="Compliance 90 Days" value={complianceAlertCounts.days90} icon={ShieldAlert} />
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

type ComplianceEmployee = {
  work_permit_expiry?: string | null;
  passport_expiry?: string | null;
  medical_expiry?: string | null;
  wsq_expiry?: string | null;
  first_aid_expiry?: string | null;
};

const complianceDateFields: (keyof ComplianceEmployee)[] = [
  "work_permit_expiry",
  "passport_expiry",
  "medical_expiry",
  "wsq_expiry",
  "first_aid_expiry"
];

function getDaysUntil(value: string | null | undefined) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(value);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getComplianceAlertCounts(employees: ComplianceEmployee[]) {
  return employees.reduce(
    (counts, employee) => {
      complianceDateFields.forEach((field) => {
        const days = getDaysUntil(employee[field]);
        if (days === null || days > 90) return;
        if (days <= 30) counts.days30 += 1;
        else if (days <= 60) counts.days60 += 1;
        else counts.days90 += 1;
      });
      return counts;
    },
    { days30: 0, days60: 0, days90: 0 }
  );
}
