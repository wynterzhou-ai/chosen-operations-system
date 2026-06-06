import CustomerPortalShell from "@/components/CustomerPortalShell";
import PortalDashboard from "@/components/PortalDashboard";
import { getPortalContext } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, ChecklistSubmission, Invoice, Quotation } from "@/types/database";

export default async function PortalPage() {
  const { context, error } = await getPortalContext();

  if (!context) {
    return (
      <CustomerPortalShell>
        <div className="panel p-6 text-sm text-red-700">{error}</div>
      </CustomerPortalShell>
    );
  }

  const supabase = createClient();
  const [unpaidInvoices, latestInvoices, latestQuotations, attendanceRecords, checklistIssues, checklistSubmissions] = await Promise.all([
    supabase.from("invoices").select("total").eq("client_id", context.client.id).neq("payment_status", "paid"),
    supabase.from("invoices").select("*").eq("client_id", context.client.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("quotations").select("*").eq("client_id", context.client.id).order("created_at", { ascending: false }).limit(5),
    supabase
      .from("attendance_records")
      .select("*, employees(name)")
      .eq("client_id", context.client.id)
      .order("check_in_time", { ascending: false })
      .limit(6),
    supabase.from("checklist_submissions").select("id", { count: "exact", head: true }).eq("client_id", context.client.id).eq("status", "issue"),
    supabase
      .from("checklist_submissions")
      .select("*, checklist_templates(name)")
      .eq("client_id", context.client.id)
      .order("submission_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const outstandingAmount = unpaidInvoices.data?.reduce((sum, invoice) => sum + Number(invoice.total), 0) ?? 0;

  return (
    <CustomerPortalShell clientName={context.client.name}>
      <PortalDashboard
        client={context.client}
        outstandingAmount={outstandingAmount}
        invoices={(latestInvoices.data ?? []) as Invoice[]}
        quotations={(latestQuotations.data ?? []) as Quotation[]}
        attendanceRecords={(attendanceRecords.data ?? []) as AttendanceRecord[]}
        checklistIssuesCount={checklistIssues.count ?? 0}
        checklistSubmissions={(checklistSubmissions.data ?? []) as ChecklistSubmission[]}
      />
    </CustomerPortalShell>
  );
}
