import CustomerPortalShell from "@/components/CustomerPortalShell";
import PortalChecklists from "@/components/PortalChecklists";
import { getPortalContext } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistSubmission } from "@/types/database";

export default async function PortalChecklistsPage() {
  const { context, error } = await getPortalContext();

  if (!context) {
    return (
      <CustomerPortalShell>
        <div className="panel p-6 text-sm text-red-700">{error}</div>
      </CustomerPortalShell>
    );
  }

  const supabase = createClient();
  const submissions = await supabase
    .from("checklist_submissions")
    .select("*, checklist_templates(name), checklist_submission_items(*, checklist_items(item_text,sort_order))")
    .eq("client_id", context.client.id)
    .order("submission_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <CustomerPortalShell clientName={context.client.name}>
      <div className="mb-6">
        <p className="label">Cleaning Quality</p>
        <h2 className="text-2xl font-semibold text-ink">Checklists</h2>
      </div>
      {submissions.error ? <div className="panel mb-6 p-4 text-sm text-red-700">{submissions.error.message}</div> : null}
      <PortalChecklists submissions={(submissions.data ?? []) as ChecklistSubmission[]} />
    </CustomerPortalShell>
  );
}
