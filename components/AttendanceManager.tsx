"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, LogIn, LogOut, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { AttendanceRecord, Client, Employee, Roster } from "@/types/database";

type AttendanceManagerProps = {
  employees: Employee[];
  clients: Client[];
  rosters: Roster[];
  activeRecords: AttendanceRecord[];
};

type LocationResult = {
  lat: number | null;
  lng: number | null;
  warning: string | null;
};

function getBrowserLocation(): Promise<LocationResult> {
  if (!navigator.geolocation) {
    return Promise.resolve({
      lat: null,
      lng: null,
      warning: "GPS is not available in this browser. Attendance will be saved without location."
    });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          warning: null
        });
      },
      () => {
        resolve({
          lat: null,
          lng: null,
          warning: "GPS permission was denied or unavailable. Attendance was saved without location."
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

function formatTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

export default function AttendanceManager({ employees, clients, rosters, activeRecords }: AttendanceManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null);
  const [checkInPhoto, setCheckInPhoto] = useState<File | null>(null);
  const [checkoutPhotos, setCheckoutPhotos] = useState<Record<string, File | null>>({});
  const [form, setForm] = useState({
    employee_id: employees[0]?.id ?? "",
    client_id: clients[0]?.id ?? "",
    roster_id: "",
    remarks: ""
  });

  const matchingRosters = useMemo(() => {
    return rosters.filter((roster) => {
      const employeeMatches = !form.employee_id || roster.employee_id === form.employee_id;
      const clientMatches = !form.client_id || roster.client_id === form.client_id;
      return employeeMatches && clientMatches;
    });
  }, [form.client_id, form.employee_id, rosters]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "employee_id" || field === "client_id" ? { roster_id: "" } : {})
    }));
  }

  async function uploadPhoto(file: File | null, prefix: string) {
    if (!file) return null;

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `${prefix}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("attendance-photos").upload(filePath, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("attendance-photos").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function checkIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setWarning("");
    setLoading(true);

    if (!form.employee_id || !form.client_id) {
      setError("Please select an employee and client before checking in.");
      setLoading(false);
      return;
    }

    try {
      const location = await getBrowserLocation();
      if (location.warning) setWarning(location.warning);
      const photoUrl = await uploadPhoto(checkInPhoto, "check-in");
      const supabase = createClient();

      const { error: insertError } = await supabase.from("attendance_records").insert({
        employee_id: form.employee_id,
        client_id: form.client_id,
        roster_id: form.roster_id || null,
        check_in_time: new Date().toISOString(),
        check_in_lat: location.lat,
        check_in_lng: location.lng,
        check_in_photo_url: photoUrl,
        remarks: form.remarks || null,
        status: "checked_in"
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      setCheckInPhoto(null);
      setForm((current) => ({ ...current, roster_id: "", remarks: "" }));
      router.refresh();
    } catch (checkInError) {
      setError(checkInError instanceof Error ? checkInError.message : "Unable to save check-in.");
    } finally {
      setLoading(false);
    }
  }

  async function checkOut(record: AttendanceRecord) {
    setError("");
    setWarning("");
    setCheckoutLoadingId(record.id);

    try {
      const location = await getBrowserLocation();
      if (location.warning) setWarning(location.warning);
      const photoUrl = await uploadPhoto(checkoutPhotos[record.id] ?? null, "check-out");
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("attendance_records")
        .update({
          check_out_time: new Date().toISOString(),
          check_out_lat: location.lat,
          check_out_lng: location.lng,
          check_out_photo_url: photoUrl,
          status: "checked_out",
          updated_at: new Date().toISOString()
        })
        .eq("id", record.id);

      if (updateError) {
        setError(updateError.message);
        setCheckoutLoadingId(null);
        return;
      }

      setCheckoutPhotos((current) => ({ ...current, [record.id]: null }));
      router.refresh();
    } catch (checkOutError) {
      setError(checkOutError instanceof Error ? checkOutError.message : "Unable to save check-out.");
    } finally {
      setCheckoutLoadingId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form className="panel space-y-4 p-5" onSubmit={checkIn}>
        <div>
          <h2 className="font-semibold text-ink">Mobile Check In</h2>
          <p className="mt-1 text-sm text-slate-500">GPS is captured when available.</p>
        </div>

        <div>
          <label className="label">Employee</label>
          <select className="field mt-1" value={form.employee_id} onChange={(event) => updateField("employee_id", event.target.value)} required>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Client</label>
          <select className="field mt-1" value={form.client_id} onChange={(event) => updateField("client_id", event.target.value)} required>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Today&apos;s Roster</label>
          <select className="field mt-1" value={form.roster_id} onChange={(event) => updateField("roster_id", event.target.value)}>
            <option value="">No roster selected</option>
            {matchingRosters.map((roster) => (
              <option key={roster.id} value={roster.id}>
                {roster.start_time} - {roster.end_time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Check-in Photo</label>
          <input className="field mt-1" type="file" accept="image/*" onChange={(event) => setCheckInPhoto(event.target.files?.[0] ?? null)} />
        </div>

        <div>
          <label className="label">Remarks</label>
          <textarea className="field mt-1 min-h-20" value={form.remarks} onChange={(event) => updateField("remarks", event.target.value)} />
        </div>

        {warning ? <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{warning}</p> : null}
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <button className="btn-primary w-full" disabled={loading || !employees.length || !clients.length}>
          <LogIn size={16} />
          {loading ? "Checking in..." : "Check In"}
        </button>
      </form>

      <section className="space-y-4">
        <div className="panel p-5">
          <h2 className="font-semibold text-ink">Active Check-ins</h2>
          <p className="mt-1 text-sm text-slate-500">{activeRecords.length} employee{activeRecords.length === 1 ? "" : "s"} currently checked in.</p>
        </div>

        {activeRecords.map((record) => (
          <article className="panel p-5" key={record.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-ink">{record.employees?.name ?? "Employee"}</p>
                <p className="text-sm text-slate-500">{record.clients?.name ?? "Client"}</p>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p>{formatDate(record.check_in_time)}</p>
                <p>{formatTime(record.check_in_time)}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={16} />
                {record.check_in_lat && record.check_in_lng ? `${Number(record.check_in_lat).toFixed(5)}, ${Number(record.check_in_lng).toFixed(5)}` : "No check-in GPS"}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Camera size={16} />
                {record.check_in_photo_url ? (
                  <a className="font-medium text-brand hover:underline" href={record.check_in_photo_url} target="_blank">
                    View check-in photo
                  </a>
                ) : (
                  "No check-in photo"
                )}
              </div>
            </div>

            {record.remarks ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{record.remarks}</p> : null}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                className="field"
                type="file"
                accept="image/*"
                onChange={(event) => setCheckoutPhotos((current) => ({ ...current, [record.id]: event.target.files?.[0] ?? null }))}
              />
              <button className="btn-primary sm:w-auto" type="button" onClick={() => checkOut(record)} disabled={checkoutLoadingId === record.id}>
                <LogOut size={16} />
                {checkoutLoadingId === record.id ? "Checking out..." : "Check Out"}
              </button>
            </div>
          </article>
        ))}

        {!activeRecords.length ? <div className="panel p-6 text-sm text-slate-500">No active check-ins.</div> : null}
      </section>
    </div>
  );
}
