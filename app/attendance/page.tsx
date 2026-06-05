import AppShell from "@/components/AppShell";
import AttendanceManager from "@/components/AttendanceManager";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, Client, Employee, Roster } from "@/types/database";

export default async function AttendancePage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [employees, clients, rosters, activeRecords] = await Promise.all([
    supabase.from("employees").select("*").eq("status", "active").order("name"),
    supabase.from("clients").select("*").eq("status", "active").order("name"),
    supabase
      .from("rosters")
      .select("*, clients(name), employees(name)")
      .eq("shift_date", today)
      .order("start_time", { ascending: true }),
    supabase
      .from("attendance_records")
      .select("*, clients(name), employees(name), rosters(shift_date,start_time,end_time)")
      .eq("status", "checked_in")
      .order("check_in_time", { ascending: false })
  ]);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">V2.1</p>
        <h1 className="text-2xl font-semibold text-ink">Mobile Attendance</h1>
      </div>

      {employees.error || clients.error || rosters.error || activeRecords.error ? (
        <div className="panel mb-6 p-4 text-sm text-red-700">
          {employees.error?.message ?? clients.error?.message ?? rosters.error?.message ?? activeRecords.error?.message}
        </div>
      ) : null}

      <AttendanceManager
        employees={(employees.data ?? []) as Employee[]}
        clients={(clients.data ?? []) as Client[]}
        rosters={(rosters.data ?? []) as Roster[]}
        activeRecords={(activeRecords.data ?? []) as AttendanceRecord[]}
      />
    </AppShell>
  );
}
