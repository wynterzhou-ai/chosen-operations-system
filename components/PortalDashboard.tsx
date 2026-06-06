import Link from "next/link";
import { CalendarCheck, FileText, ListChecks, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AttendanceRecord, ChecklistSubmission, Client, Invoice, Quotation } from "@/types/database";

type PortalDashboardProps = {
  client: Client;
  outstandingAmount: number;
  invoices: Invoice[];
  quotations: Quotation[];
  attendanceRecords: AttendanceRecord[];
  checklistIssuesCount: number;
  checklistSubmissions: ChecklistSubmission[];
};

function quotationNumber(quotation: Quotation) {
  return quotation.quote_number ?? quotation.quotation_no ?? "Quotation";
}

export default function PortalDashboard({
  client,
  outstandingAmount,
  invoices,
  quotations,
  attendanceRecords,
  checklistIssuesCount,
  checklistSubmissions
}: PortalDashboardProps) {
  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <p className="label">Customer Portal</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink">{client.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{client.address ?? "Service records and finance history"}</p>
          </div>
          <div className="rounded-md bg-slate-50 px-4 py-3 text-right">
            <p className="label">Outstanding</p>
            <p className="text-lg font-semibold text-ink">{formatCurrency(outstandingAmount)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link className="panel block p-4 transition hover:border-brand" href="/portal/invoices">
          <Receipt className="text-brand" size={20} />
          <p className="mt-3 label">Latest Invoices</p>
          <p className="mt-1 text-xl font-semibold text-ink">{invoices.length}</p>
        </Link>
        <Link className="panel block p-4 transition hover:border-brand" href="/portal/quotations">
          <FileText className="text-brand" size={20} />
          <p className="mt-3 label">Latest Quotations</p>
          <p className="mt-1 text-xl font-semibold text-ink">{quotations.length}</p>
        </Link>
        <Link className="panel block p-4 transition hover:border-brand" href="/portal/attendance">
          <CalendarCheck className="text-brand" size={20} />
          <p className="mt-3 label">Recent Attendance</p>
          <p className="mt-1 text-xl font-semibold text-ink">{attendanceRecords.length}</p>
        </Link>
        <Link className="panel block p-4 transition hover:border-brand" href="/portal/checklists">
          <ListChecks className={checklistIssuesCount ? "text-red-600" : "text-brand"} size={20} />
          <p className="mt-3 label">Checklist Issues</p>
          <p className="mt-1 text-xl font-semibold text-ink">{checklistIssuesCount}</p>
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">Latest Invoices</h3>
            <Link className="text-sm font-medium text-brand hover:underline" href="/portal/invoices">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {invoices.map((invoice) => (
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3 text-sm last:border-0" key={invoice.id}>
                <div>
                  <p className="font-medium text-ink">{invoice.invoice_number}</p>
                  <p className="text-slate-500">{formatDate(invoice.issue_date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">{formatCurrency(Number(invoice.total))}</p>
                  <p className="capitalize text-slate-500">{invoice.payment_status}</p>
                </div>
              </div>
            ))}
            {!invoices.length ? <p className="text-sm text-slate-500">No invoices available.</p> : null}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">Latest Quotations</h3>
            <Link className="text-sm font-medium text-brand hover:underline" href="/portal/quotations">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {quotations.map((quotation) => (
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3 text-sm last:border-0" key={quotation.id}>
                <div>
                  <p className="font-medium text-ink">{quotationNumber(quotation)}</p>
                  <p className="text-slate-500">{formatDate(quotation.issue_date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">{formatCurrency(Number(quotation.total))}</p>
                  <p className="capitalize text-slate-500">{quotation.status}</p>
                </div>
              </div>
            ))}
            {!quotations.length ? <p className="text-sm text-slate-500">No quotations available.</p> : null}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">Recent Attendance</h3>
            <Link className="text-sm font-medium text-brand hover:underline" href="/portal/attendance">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {attendanceRecords.map((record) => (
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3 text-sm last:border-0" key={record.id}>
                <div>
                  <p className="font-medium text-ink">{record.employees?.name ?? "Cleaner"}</p>
                  <p className="text-slate-500">{formatDate(record.check_in_time)}</p>
                </div>
                <p className="capitalize text-slate-600">{record.status.replace(/_/g, " ")}</p>
              </div>
            ))}
            {!attendanceRecords.length ? <p className="text-sm text-slate-500">No attendance records available.</p> : null}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">Checklist Updates</h3>
            <Link className="text-sm font-medium text-brand hover:underline" href="/portal/checklists">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {checklistSubmissions.map((submission) => (
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3 text-sm last:border-0" key={submission.id}>
                <div>
                  <p className="font-medium text-ink">{submission.checklist_templates?.name ?? "Checklist"}</p>
                  <p className="text-slate-500">{formatDate(submission.submission_date)}</p>
                </div>
                <p className={submission.status === "issue" ? "font-medium text-red-700" : "font-medium text-brand"}>{submission.status}</p>
              </div>
            ))}
            {!checklistSubmissions.length ? <p className="text-sm text-slate-500">No checklist records available.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
