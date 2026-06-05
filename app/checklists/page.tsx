import AppShell from "@/components/AppShell";
import ChecklistManager from "@/components/ChecklistManager";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem, ChecklistSubmission, ChecklistTemplate, Client } from "@/types/database";

export default async function ChecklistsPage() {
  const supabase = createClient();

  const [clients, templates, items, submissions] = await Promise.all([
    supabase.from("clients").select("*").eq("status", "active").order("name"),
    supabase.from("checklist_templates").select("*").eq("is_active", true).order("name"),
    supabase.from("checklist_items").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("checklist_submissions")
      .select("*, clients(name), checklist_templates(name), checklist_submission_items(*, checklist_items(item_text,sort_order))")
      .order("submission_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(25)
  ]);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">V2.2</p>
        <h1 className="text-2xl font-semibold text-ink">Cleaning Checklists</h1>
      </div>

      {clients.error || templates.error || items.error || submissions.error ? (
        <div className="panel mb-6 p-4 text-sm text-red-700">
          {clients.error?.message ?? templates.error?.message ?? items.error?.message ?? submissions.error?.message}
        </div>
      ) : null}

      <ChecklistManager
        clients={(clients.data ?? []) as Client[]}
        templates={(templates.data ?? []) as ChecklistTemplate[]}
        items={(items.data ?? []) as ChecklistItem[]}
        submissions={(submissions.data ?? []) as ChecklistSubmission[]}
      />
    </AppShell>
  );
}
