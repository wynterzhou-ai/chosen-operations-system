import CustomerPortalShell from "@/components/CustomerPortalShell";
import PortalQuotations from "@/components/PortalQuotations";
import { getPortalContext } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import type { Quotation, QuotationItem } from "@/types/database";

type PortalQuotation = Quotation & {
  quotation_items?: QuotationItem[];
};

export default async function PortalQuotationsPage() {
  const { context, error } = await getPortalContext();

  if (!context) {
    return (
      <CustomerPortalShell>
        <div className="panel p-6 text-sm text-red-700">{error}</div>
      </CustomerPortalShell>
    );
  }

  const supabase = createClient();
  const quotationsResult = await supabase
    .from("quotations")
    .select("*, clients(name,email,address)")
    .eq("client_id", context.client.id)
    .order("created_at", { ascending: false });

  const quotationIds = (quotationsResult.data ?? []).map((quotation) => quotation.id);
  const quotationItemsResult = quotationIds.length
    ? await supabase.from("quotation_items").select("*").in("quotation_id", quotationIds)
    : { data: [] as QuotationItem[], error: null };

  const quotationItems = (quotationItemsResult.data ?? []) as QuotationItem[];
  const quotations = ((quotationsResult.data ?? []) as PortalQuotation[]).map((quotation) => ({
    ...quotation,
    quotation_items: quotationItems.filter((item) => item.quotation_id === quotation.id)
  }));

  return (
    <CustomerPortalShell clientName={context.client.name}>
      <div className="mb-6">
        <p className="label">Sales</p>
        <h2 className="text-2xl font-semibold text-ink">Quotations</h2>
      </div>
      {quotationsResult.error || quotationItemsResult.error ? (
        <div className="panel mb-6 p-4 text-sm text-red-700">
          {quotationsResult.error?.message ?? quotationItemsResult.error?.message}
        </div>
      ) : null}
      <PortalQuotations quotations={quotations} />
    </CustomerPortalShell>
  );
}
