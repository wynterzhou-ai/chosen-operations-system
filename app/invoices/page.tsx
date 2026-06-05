import AppShell from "@/components/AppShell";
import InvoicesManager from "@/components/InvoicesManager";
import { createClient } from "@/lib/supabase/server";
import type { Client, Invoice, InvoiceItem } from "@/types/database";

type InvoiceWithItems = Invoice & {
  invoice_items?: InvoiceItem[];
};

export default async function InvoicesPage() {
  const supabase = createClient();
  const [clients, invoices] = await Promise.all([
    supabase.from("clients").select("*").eq("status", "active").order("name"),
    supabase
      .from("invoices")
      .select("*, clients(name,email,address), invoice_items(*)")
      .order("created_at", { ascending: false })
  ]);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Finance</p>
        <h1 className="text-2xl font-semibold text-ink">Invoices</h1>
      </div>
      <InvoicesManager clients={(clients.data ?? []) as Client[]} invoices={(invoices.data ?? []) as InvoiceWithItems[]} />
    </AppShell>
  );
}
