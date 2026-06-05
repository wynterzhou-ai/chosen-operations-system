"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FilePlus2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { downloadBusinessPdf } from "@/lib/pdf";
import { formatCurrency, formatDate, nextDocumentNumber } from "@/lib/format";
import type { Client, Quotation, QuotationItem } from "@/types/database";

type QuotationWithItems = Quotation & {
  quotation_items?: QuotationItem[];
};

type QuotationsManagerProps = {
  clients: Client[];
  quotations: QuotationWithItems[];
};

export default function QuotationsManager({ clients, quotations }: QuotationsManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_id: clients[0]?.id ?? "",
    valid_until: "",
    description: "Cleaning services",
    quantity: "1",
    unit_price: "0",
    tax: "0",
    notes: ""
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function getQuotationNumber(quotation: QuotationWithItems) {
    return quotation.quote_number ?? quotation.quotation_no ?? "Quotation";
  }

  function getGst(quotation: QuotationWithItems) {
    return Number(quotation.tax ?? quotation.gst ?? 0);
  }

  function getItems(quotation: QuotationWithItems): QuotationItem[] {
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

  async function addQuotation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (!form.client_id) {
      setError("Please add or select an active client before creating a quotation.");
      setLoading(false);
      return;
    }

    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unit_price);
    const subtotal = quantity * unitPrice;
    const gst = Number(form.tax);
    const total = subtotal + gst;

    if (!form.description.trim()) {
      setError("Service description is required.");
      setLoading(false);
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(gst) || gst < 0) {
      setError("Quantity, unit price, and GST must be valid numbers.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const quotationNo = nextDocumentNumber("QT");

    try {
      const { data: quotation, error: quotationError } = await supabase
        .from("quotations")
        .insert({
          quote_number: quotationNo,
          client_id: form.client_id,
          issue_date: new Date().toISOString().slice(0, 10),
          valid_until: form.valid_until || null,
          status: "draft",
          subtotal,
          tax: gst,
          total,
          notes: form.notes || null
        })
        .select()
        .single();

      if (quotationError) {
        console.error("Normalized quotation insert failed", quotationError);

        const { error: flatError } = await supabase.from("quotations").insert({
          quotation_no: quotationNo,
          client_id: form.client_id,
          service_description: form.description.trim(),
          quantity,
          unit_price: unitPrice,
          subtotal,
          gst,
          total,
          status: "draft",
          notes: form.notes || null
        });

        if (flatError) {
          console.error("Flat quotation insert failed", flatError);
          setError(flatError.message);
          setLoading(false);
          return;
        }
      } else {
        const { error: itemError } = await supabase.from("quotation_items").insert({
          quotation_id: quotation.id,
          description: form.description.trim(),
          quantity,
          unit_price: unitPrice,
          amount: subtotal
        });

        if (itemError) {
          console.error("Quotation item insert failed", itemError);
          setError(itemError.message);
          setLoading(false);
          return;
        }
      }
    } catch (insertError) {
      console.error("Quotation creation failed", insertError);
      setError(insertError instanceof Error ? insertError.message : "Quotation could not be created.");
      setLoading(false);
      return;
    }

    setForm((current) => ({
      ...current,
      description: "Cleaning services",
      quantity: "1",
      unit_price: "0",
      tax: "0",
      notes: ""
    }));
    setLoading(false);
    router.refresh();
  }

  async function updateStatus(id: string, status: string) {
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.from("quotations").update({ status }).eq("id", id);
    if (updateError) {
      console.error("Quotation status update failed", updateError);
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  async function convertToInvoice(quotation: QuotationWithItems) {
    setError("");
    const supabase = createClient();
    const { data: existing } = await supabase.from("invoices").select("id").eq("quotation_id", quotation.id).maybeSingle();
    if (existing) {
      setError("This quotation has already been converted to an invoice.");
      return;
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: nextDocumentNumber("INV"),
        quotation_id: quotation.id,
        client_id: quotation.client_id,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: null,
        payment_status: "unpaid",
        subtotal: quotation.subtotal,
        tax: getGst(quotation),
        total: quotation.total,
        notes: quotation.notes
      })
      .select()
      .single();

    if (invoiceError) {
      setError(invoiceError.message);
      return;
    }

    const items = getItems(quotation);
    if (items.length) {
      const { error: itemError } = await supabase.from("invoice_items").insert(
        items.map((item) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount
        }))
      );
      if (itemError) {
        setError(itemError.message);
        return;
      }
    }

    const { error: statusError } = await supabase.from("quotations").update({ status: "accepted" }).eq("id", quotation.id);
    if (statusError) {
      console.error("Quotation acceptance update failed", statusError);
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form className="panel space-y-4 p-5" onSubmit={addQuotation}>
        <h2 className="font-semibold text-ink">New Quotation</h2>
        <div>
          <label className="label">Client</label>
          <select className="field mt-1" value={form.client_id} onChange={(event) => updateField("client_id", event.target.value)} required>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Valid Until</label>
          <input className="field mt-1" type="date" value={form.valid_until} onChange={(event) => updateField("valid_until", event.target.value)} />
        </div>
        <div>
          <label className="label">Service Description</label>
          <input className="field mt-1" value={form.description} onChange={(event) => updateField("description", event.target.value)} required />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Qty</label>
            <input className="field mt-1" type="number" min="1" value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} />
          </div>
          <div>
            <label className="label">Unit Price</label>
            <input className="field mt-1" type="number" min="0" step="0.01" value={form.unit_price} onChange={(event) => updateField("unit_price", event.target.value)} />
          </div>
          <div>
            <label className="label">GST</label>
            <input className="field mt-1" type="number" min="0" step="0.01" value={form.tax} onChange={(event) => updateField("tax", event.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="field mt-1 min-h-20" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
        </div>
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button className="btn-primary" disabled={!clients.length || loading}>
          {loading ? "Creating..." : "Create Quotation"}
        </button>
      </form>

      <div className="space-y-4">
        {quotations.map((quotation) => (
          <section className="panel p-5" key={quotation.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-ink">{getQuotationNumber(quotation)}</p>
                <p className="text-sm text-slate-500">
                  {quotation.clients?.name ?? "-"} · {formatDate(quotation.issue_date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{formatCurrency(Number(quotation.total))}</p>
                <p className="text-sm capitalize text-slate-500">{quotation.status}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <select className="field max-w-36" value={quotation.status} onChange={(event) => updateStatus(quotation.id, event.target.value)}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className="btn-secondary" type="button" onClick={() => downloadBusinessPdf("Quotation", quotation, getItems(quotation))}>
                <Download size={16} />
                PDF
              </button>
              <button className="btn-primary" type="button" onClick={() => convertToInvoice(quotation)}>
                <FilePlus2 size={16} />
                Convert to Invoice
              </button>
            </div>
          </section>
        ))}
        {!quotations.length ? <div className="panel p-6 text-sm text-slate-500">No quotations yet.</div> : null}
      </div>
    </div>
  );
}
