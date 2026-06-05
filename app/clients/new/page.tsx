import AppShell from "@/components/AppShell";
import ClientForm from "@/components/ClientForm";

export default function NewClientPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Clients</p>
        <h1 className="text-2xl font-semibold text-ink">New Client</h1>
      </div>
      <ClientForm />
    </AppShell>
  );
}
