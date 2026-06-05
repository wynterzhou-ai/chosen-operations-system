import AppShell from "@/components/AppShell";
import QuotationsManager from "@/components/QuotationsManager";
import { createClient } from "@/lib/supabase/server";
import type { Client, Quotation, QuotationItem } from "@/types/database";

type QuotationWithItems = Quotation & {
  quotation_items?: QuotationItem[];
};

export default async function QuotationsPage() {
  const supabase = createClient();
  const [clients, quotationsResult, quotationItemsResult] = await Promise.all([
    supabase.from("clients").select("*").eq("status", "active").order("name"),
    supabase
      .from("quotations")
      .select("*, clients(name,email,address)")
      .order("created_at", { ascending: false }),
    supabase.from("quotation_items").select("*")
  ]);

  const quotationItems = (quotationItemsResult.data ?? []) as QuotationItem[];
  const quotations = ((quotationsResult.data ?? []) as QuotationWithItems[]).map((quotation) => ({
    ...quotation,
    quotation_items: quotationItems.filter((item) => item.quotation_id === quotation.id)
  }));

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Sales</p>
        <h1 className="text-2xl font-semibold text-ink">Quotations</h1>
      </div>
      {clients.error || quotationsResult.error ? (
        <div className="panel mb-6 p-4 text-sm text-red-700">
          {clients.error?.message ?? quotationsResult.error?.message}
        </div>
      ) : null}
      <QuotationsManager
        clients={(clients.data ?? []) as Client[]}
        quotations={quotations}
      />
    </AppShell>
  );
}
