"use client";

import { Download } from "lucide-react";
import { downloadBusinessPdf } from "@/lib/pdf";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Quotation, QuotationItem } from "@/types/database";

type PortalQuotation = Quotation & {
  quotation_items?: QuotationItem[];
};

function getQuotationNumber(quotation: PortalQuotation) {
  return quotation.quote_number ?? quotation.quotation_no ?? "Quotation";
}

function getItems(quotation: PortalQuotation): QuotationItem[] {
  if (quotation.quotation_items?.length) return quotation.quotation_items;
  if (!quotation.service_description) return [];

  const quantity = Number(quotation.quantity ?? 1);
  const unitPrice = Number(quotation.unit_price ?? quotation.subtotal ?? 0);

  return [
    {
      id: quotation.id,
      quotation_id: quotation.id,
      description: quotation.service_description,
      quantity,
      unit_price: unitPrice,
      amount: Number(quotation.subtotal ?? quantity * unitPrice)
    }
  ];
}

export default function PortalQuotations({ quotations }: { quotations: PortalQuotation[] }) {
  return (
    <div className="space-y-4">
      {quotations.map((quotation) => (
        <article className="panel p-5" key={quotation.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-ink">{getQuotationNumber(quotation)}</p>
              <p className="mt-1 text-sm text-slate-500">
                Issued {formatDate(quotation.issue_date)} / Valid until {formatDate(quotation.valid_until)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-ink">{formatCurrency(Number(quotation.total))}</p>
              <p className="text-sm capitalize text-slate-500">{quotation.status}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium capitalize text-slate-600">{quotation.status}</span>
            <button className="btn-secondary" type="button" onClick={() => downloadBusinessPdf("Quotation", quotation, getItems(quotation))}>
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </article>
      ))}

      {!quotations.length ? <div className="panel p-6 text-sm text-slate-500">No quotations available.</div> : null}
    </div>
  );
}
