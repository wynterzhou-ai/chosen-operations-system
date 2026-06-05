"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { Client, InspectionReport } from "@/types/database";

type InspectionsManagerProps = {
  clients: Client[];
  reports: InspectionReport[];
};

export default function InspectionsManager({ clients, reports }: InspectionsManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    client_id: clients[0]?.id ?? "",
    inspected_by: "",
    inspection_date: new Date().toISOString().slice(0, 10),
    score: "90",
    notes: ""
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function addReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const supabase = createClient();
    let photoUrl: string | null = null;

    if (photo) {
      const filePath = `${crypto.randomUUID()}-${photo.name}`;
      const { error: uploadError } = await supabase.storage.from("inspection-photos").upload(filePath, photo);
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      const { data } = supabase.storage.from("inspection-photos").getPublicUrl(filePath);
      photoUrl = data.publicUrl;
    }

    const { error: insertError } = await supabase.from("inspection_reports").insert({
      ...form,
      inspected_by: form.inspected_by || null,
      notes: form.notes || null,
      score: Number(form.score),
      photo_url: photoUrl
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setPhoto(null);
    setForm((current) => ({ ...current, notes: "", inspected_by: "" }));
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form className="panel space-y-4 p-5" onSubmit={addReport}>
        <h2 className="font-semibold text-ink">New Inspection</h2>
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input className="field mt-1" type="date" value={form.inspection_date} onChange={(event) => updateField("inspection_date", event.target.value)} />
          </div>
          <div>
            <label className="label">Score</label>
            <input className="field mt-1" type="number" min="0" max="100" value={form.score} onChange={(event) => updateField("score", event.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Inspected By</label>
          <input className="field mt-1" value={form.inspected_by} onChange={(event) => updateField("inspected_by", event.target.value)} />
        </div>
        <div>
          <label className="label">Photo</label>
          <input className="field mt-1" type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="field mt-1 min-h-20" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
        </div>
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button className="btn-primary" disabled={!clients.length}>
          Save Report
        </button>
      </form>

      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Photo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="px-4 py-3">{formatDate(report.inspection_date)}</td>
                <td className="px-4 py-3">{report.clients?.name ?? "-"}</td>
                <td className="px-4 py-3">{report.score}%</td>
                <td className="px-4 py-3">
                  {report.photo_url ? (
                    <a className="font-medium text-brand hover:underline" href={report.photo_url} target="_blank">
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
            {!reports.length ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={4}>
                  No inspection reports yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
