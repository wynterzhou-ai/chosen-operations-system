"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { Client, Employee, Roster } from "@/types/database";

type RostersManagerProps = {
  clients: Client[];
  employees: Employee[];
  rosters: Roster[];
};

export default function RostersManager({ clients, employees, rosters }: RostersManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    client_id: clients[0]?.id ?? "",
    employee_id: employees[0]?.id ?? "",
    shift_date: new Date().toISOString().slice(0, 10),
    start_time: "08:00",
    end_time: "17:00",
    notes: ""
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function addRoster(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const supabase = createClient();
    const { error: insertError } = await supabase.from("rosters").insert({
      ...form,
      notes: form.notes || null
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm((current) => ({ ...current, notes: "" }));
    router.refresh();
  }

  async function removeRoster(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("rosters").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form className="panel space-y-4 p-5" onSubmit={addRoster}>
        <h2 className="font-semibold text-ink">Assign Shift</h2>
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
          <label className="label">Employee</label>
          <select className="field mt-1" value={form.employee_id} onChange={(event) => updateField("employee_id", event.target.value)} required>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Date</label>
            <input className="field mt-1" type="date" value={form.shift_date} onChange={(event) => updateField("shift_date", event.target.value)} />
          </div>
          <div>
            <label className="label">Start</label>
            <input className="field mt-1" type="time" value={form.start_time} onChange={(event) => updateField("start_time", event.target.value)} />
          </div>
          <div>
            <label className="label">End</label>
            <input className="field mt-1" type="time" value={form.end_time} onChange={(event) => updateField("end_time", event.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="field mt-1 min-h-20" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
        </div>
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button className="btn-primary" disabled={!clients.length || !employees.length}>
          Add Roster
        </button>
      </form>

      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rosters.map((roster) => (
              <tr key={roster.id}>
                <td className="px-4 py-3">{formatDate(roster.shift_date)}</td>
                <td className="px-4 py-3">{roster.clients?.name ?? "-"}</td>
                <td className="px-4 py-3">{roster.employees?.name ?? "-"}</td>
                <td className="px-4 py-3">
                  {roster.start_time} - {roster.end_time}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-sm font-medium text-red-700 hover:underline" onClick={() => removeRoster(roster.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!rosters.length ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  No roster assignments yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
