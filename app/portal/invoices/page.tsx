import CustomerPortalShell from "@/components/CustomerPortalShell";
import PortalInvoices from "@/components/PortalInvoices";
import { getPortalContext } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import type { Invoice, InvoiceItem } from "@/types/database";

type PortalInvoice = Invoice & {
  invoice_items?: InvoiceItem[];
};

export default async function PortalInvoicesPage() {
  const { context, error } = await getPortalContext();

  if (!context) {
    return (
      <CustomerPortalShell>
        <div className="panel p-6 text-sm text-red-700">{error}</div>
      </CustomerPortalShell>
    );
  }

  const supabase = createClient();
  const invoices = await supabase
    .from("invoices")
    .select("*, clients(name,email,address), invoice_items(*)")
    .eq("client_id", context.client.id)
    .order("created_at", { ascending: false });

  return (
    <CustomerPortalShell clientName={context.client.name}>
      <div className="mb-6">
        <p className="label">Finance</p>
        <h2 className="text-2xl font-semibold text-ink">Invoices</h2>
      </div>
      {invoices.error ? <div className="panel mb-6 p-4 text-sm text-red-700">{invoices.error.message}</div> : null}
      <PortalInvoices invoices={(invoices.data ?? []) as PortalInvoice[]} />
    </CustomerPortalShell>
  );
}
