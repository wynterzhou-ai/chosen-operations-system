import AppShell from "@/components/AppShell";
import RostersManager from "@/components/RostersManager";
import { createClient } from "@/lib/supabase/server";
import type { Client, Employee, Roster } from "@/types/database";

export default async function RostersPage() {
  const supabase = createClient();
  const [clients, employees, rosters] = await Promise.all([
    supabase.from("clients").select("*").eq("status", "active").order("name"),
    supabase.from("employees").select("*").eq("status", "active").order("name"),
    supabase
      .from("rosters")
      .select("*, clients(name), employees(name)")
      .order("shift_date", { ascending: false })
      .order("start_time", { ascending: true })
  ]);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Operations</p>
        <h1 className="text-2xl font-semibold text-ink">Rosters</h1>
      </div>
      <RostersManager
        clients={(clients.data ?? []) as Client[]}
        employees={(employees.data ?? []) as Employee[]}
        rosters={(rosters.data ?? []) as Roster[]}
      />
    </AppShell>
  );
}
