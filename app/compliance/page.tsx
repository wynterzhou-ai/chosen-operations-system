import AppShell from "@/components/AppShell";
import ComplianceManager from "@/components/ComplianceManager";
import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/types/database";

export default async function CompliancePage() {
  const supabase = createClient();
  const { data, error } = await supabase.from("employees").select("*").eq("status", "active").order("name");

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">V2.4</p>
        <h1 className="text-2xl font-semibold text-ink">Employee Compliance</h1>
      </div>

      {error ? <div className="panel mb-6 p-4 text-sm text-red-700">{error.message}</div> : null}

      <ComplianceManager employees={(data ?? []) as Employee[]} />
    </AppShell>
  );
}
