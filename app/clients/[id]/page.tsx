import AppShell from "@/components/AppShell";
import ClientForm from "@/components/ClientForm";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/types/database";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ClientPageError({ message }: { message: string }) {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Clients</p>
        <h1 className="text-2xl font-semibold text-ink">Edit Client</h1>
      </div>
      <div className="panel max-w-3xl p-5">
        <p className="font-semibold text-ink">Unable to load client</p>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
      </div>
    </AppShell>
  );
}

export default async function ClientDetailPage({ params }: { params: { id?: string } }) {
  const id = params.id ? decodeURIComponent(params.id) : "";

  if (!uuidPattern.test(id)) {
    return <ClientPageError message="The client link is invalid. Please return to the clients list and try again." />;
  }

  const supabase = createClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();

  if (error) {
    return <ClientPageError message={error.message} />;
  }

  if (!data) {
    return <ClientPageError message="This client could not be found. It may have been deleted." />;
  }

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Clients</p>
        <h1 className="text-2xl font-semibold text-ink">Edit Client</h1>
      </div>
      <ClientForm client={data as Client} />
    </AppShell>
  );
}
