import AppShell from "@/components/AppShell";
import InspectionsManager from "@/components/InspectionsManager";
import { createClient } from "@/lib/supabase/server";
import type { Client, InspectionReport } from "@/types/database";

export default async function InspectionsPage() {
  const supabase = createClient();
  const [clients, reports] = await Promise.all([
    supabase.from("clients").select("*").eq("status", "active").order("name"),
    supabase.from("inspection_reports").select("*, clients(name)").order("inspection_date", { ascending: false })
  ]);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Quality</p>
        <h1 className="text-2xl font-semibold text-ink">Inspection Reports</h1>
      </div>
      <InspectionsManager clients={(clients.data ?? []) as Client[]} reports={(reports.data ?? []) as InspectionReport[]} />
    </AppShell>
  );
}
