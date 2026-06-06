import CustomerPortalShell from "@/components/CustomerPortalShell";
import PortalAttendance from "@/components/PortalAttendance";
import { getPortalContext } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord } from "@/types/database";

export default async function PortalAttendancePage() {
  const { context, error } = await getPortalContext();

  if (!context) {
    return (
      <CustomerPortalShell>
        <div className="panel p-6 text-sm text-red-700">{error}</div>
      </CustomerPortalShell>
    );
  }

  const supabase = createClient();
  const records = await supabase
    .from("attendance_records")
    .select("*, employees(name), rosters(shift_date,start_time,end_time)")
    .eq("client_id", context.client.id)
    .order("check_in_time", { ascending: false })
    .limit(100);

  return (
    <CustomerPortalShell clientName={context.client.name}>
      <div className="mb-6">
        <p className="label">Service Records</p>
        <h2 className="text-2xl font-semibold text-ink">Attendance</h2>
      </div>
      {records.error ? <div className="panel mb-6 p-4 text-sm text-red-700">{records.error.message}</div> : null}
      <PortalAttendance records={(records.data ?? []) as AttendanceRecord[]} />
    </CustomerPortalShell>
  );
}
