"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { downloadBusinessPdf } from "@/lib/pdf";
import { formatCurrency, formatDate, nextDocumentNumber } from "@/lib/format";
import type { Client, Invoice, InvoiceItem } from "@/types/database";

type InvoiceWithItems = Invoice & {
  invoice_items?: InvoiceItem[];
};

type InvoicesManagerProps = {
  clients: Client[];
  invoices: InvoiceWithItems[];
};

export default function InvoicesManager({ clients, invoices }: InvoicesManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    client_id: clients[0]?.id ?? "",
    due_date: "",
    description: "Cleaning services",
    quantity: "1",
    unit_price: "0",
    tax: "0",
    notes: ""
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function addInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const supabase = createClient();
    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unit_price);
    const subtotal = quantity * unitPrice;
    const tax = Number(form.tax);
    const total = subtotal + tax;

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: nextDocumentNumber("INV"),
        quotation_id: null,
        client_id: form.client_id,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: form.due_date || null,
        payment_status: "unpaid",
        subtotal,
        tax,
        total,
        notes: form.notes || null
      })
      .select()
      .single();

    if (invoiceError) {
      setError(invoiceError.message);
      return;
    }

    const { error: itemError } = await supabase.from("invoice_items").insert({
      invoice_id: invoice.id,
      description: form.description,
      quantity,
      unit_price: unitPrice,
      amount: subtotal
    });

    if (itemError) {
      setError(itemError.message);
      return;
    }

    setForm((current) => ({ ...current, description: "Cleaning services", quantity: "1", unit_price: "0", tax: "0", notes: "" }));
    router.refresh();
  }

  async function updatePaymentStatus(id: string, payment_status: string) {
    const supabase = createClient();
    const { error: updateError } = await supabase.from("invoices").update({ payment_status }).eq("id", id);
    if (updateError) setError(updateError.message);
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form className="panel space-y-4 p-5" onSubmit={addInvoice}>
        <h2 className="font-semibold text-ink">New Invoice</h2>
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
          <label className="label">Due Date</label>
          <input className="field mt-1" type="date" value={form.due_date} onChange={(event) => updateField("due_date", event.target.value)} />
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
            <label className="label">Tax</label>
            <input className="field mt-1" type="number" min="0" step="0.01" value={form.tax} onChange={(event) => updateField("tax", event.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="field mt-1 min-h-20" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
        </div>
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button className="btn-primary" disabled={!clients.length}>
          Create Invoice
        </button>
      </form>

      <div className="space-y-4">
        {invoices.map((invoice) => (
          <section className="panel p-5" key={invoice.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-ink">{invoice.invoice_number}</p>
                <p className="text-sm text-slate-500">
                  {invoice.clients?.name ?? "-"} · {formatDate(invoice.issue_date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{formatCurrency(Number(invoice.total))}</p>
                <p className="text-sm capitalize text-slate-500">{invoice.payment_status}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <select
                className="field max-w-36"
                value={invoice.payment_status}
                onChange={(event) => updatePaymentStatus(invoice.id, event.target.value)}
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              <button className="btn-secondary" onClick={() => downloadBusinessPdf("Invoice", invoice, invoice.invoice_items ?? [])}>
                <Download size={16} />
                PDF
              </button>
            </div>
          </section>
        ))}
        {!invoices.length ? <div className="panel p-6 text-sm text-slate-500">No invoices yet.</div> : null}
      </div>
    </div>
  );
}
