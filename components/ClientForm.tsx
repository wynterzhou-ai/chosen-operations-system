"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/types/database";

type ClientFormProps = {
  client?: Client;
};

export default function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: client?.name ?? "",
    contact_person: client?.contact_person ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    address: client?.address ?? "",
    status: client?.status ?? "active"
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const payload = {
      ...form,
      contact_person: form.contact_person || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null
    };

    const result = client
      ? await supabase.from("clients").update(payload).eq("id", client.id)
      : await supabase.from("clients").insert(payload);

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    router.push("/clients");
    router.refresh();
  }

  async function remove() {
    if (!client || !confirm("Delete this client?")) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("clients").delete().eq("id", client.id);
    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }
    router.push("/clients");
    router.refresh();
  }

  return (
    <form className="panel max-w-3xl space-y-4 p-5" onSubmit={save}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Client Name</label>
          <input className="field mt-1" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
        </div>
        <div>
          <label className="label">Contact Person</label>
          <input className="field mt-1" value={form.contact_person} onChange={(event) => updateField("contact_person", event.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="field mt-1" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="field mt-1" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="field mt-1" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Address</label>
        <textarea className="field mt-1 min-h-24" value={form.address} onChange={(event) => updateField("address", event.target.value)} />
      </div>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save Client"}
        </button>
        {client ? (
          <button className="btn-danger" type="button" onClick={remove} disabled={loading}>
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
