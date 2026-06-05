import Link from "next/link";
import { Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Client } from "@/types/database";

export default async function ClientsPage() {
  const supabase = createClient();
  const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
  const clients = (data ?? []) as Client[];

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="label">Records</p>
          <h1 className="text-2xl font-semibold text-ink">Clients</h1>
        </div>
        <Link className="btn-primary" href="/clients/new">
          <Plus size={16} />
          New Client
        </Link>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link className="text-brand hover:underline" href={`/clients/${client.id}`}>
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{client.contact_person ?? "-"}</td>
                <td className="px-4 py-3">{client.phone ?? "-"}</td>
                <td className="px-4 py-3 capitalize">{client.status}</td>
                <td className="px-4 py-3">{formatDate(client.created_at)}</td>
              </tr>
            ))}
            {!clients.length ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  No clients yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
