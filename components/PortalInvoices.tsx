"use client";

import { Download } from "lucide-react";
import { downloadBusinessPdf } from "@/lib/pdf";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Invoice, InvoiceItem } from "@/types/database";

type PortalInvoice = Invoice & {
  invoice_items?: InvoiceItem[];
};

export default function PortalInvoices({ invoices }: { invoices: PortalInvoice[] }) {
  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <article className="panel p-5" key={invoice.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-ink">{invoice.invoice_number}</p>
              <p className="mt-1 text-sm text-slate-500">
                Issued {formatDate(invoice.issue_date)} / Due {formatDate(invoice.due_date)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-ink">{formatCurrency(Number(invoice.total))}</p>
              <p className="text-sm capitalize text-slate-500">{invoice.payment_status}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium capitalize text-slate-600">
              {invoice.payment_status}
            </span>
            <button className="btn-secondary" type="button" onClick={() => downloadBusinessPdf("Invoice", invoice, invoice.invoice_items ?? [])}>
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </article>
      ))}

      {!invoices.length ? <div className="panel p-6 text-sm text-slate-500">No invoices available.</div> : null}
    </div>
  );
}
