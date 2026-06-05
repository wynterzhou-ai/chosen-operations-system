import AppShell from "@/components/AppShell";
import PayrollManager from "@/components/PayrollManager";
import { createClient } from "@/lib/supabase/server";
import type { CpfRateRule, Employee } from "@/types/database";

export default async function PayrollPage() {
  const supabase = createClient();
  const [periods, employees, records, cpfRules] = await Promise.all([
    supabase.from("payroll_periods").select("*").order("start_date", { ascending: false }),
    supabase.from("employees").select("*").eq("status", "active").order("name"),
    supabase.from("payroll_records").select("*, employees(name,role)").order("created_at", { ascending: false }),
    supabase.from("cpf_rate_rules").select("*").eq("is_active", true).order("effective_from", { ascending: false })
  ]);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">V2.5</p>
        <h1 className="text-2xl font-semibold text-ink">Payroll</h1>
      </div>

      {periods.error || employees.error || records.error || cpfRules.error ? (
        <div className="panel mb-6 p-4 text-sm text-red-700">
          {periods.error?.message ?? employees.error?.message ?? records.error?.message ?? cpfRules.error?.message}
        </div>
      ) : null}

      <PayrollManager
        periods={periods.data ?? []}
        employees={(employees.data ?? []) as Employee[]}
        initialRecords={records.data ?? []}
        cpfRules={(cpfRules.data ?? []) as CpfRateRule[]}
      />
    </AppShell>
  );
}
