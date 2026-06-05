import AppShell from "@/components/AppShell";

export default function EmployeeDetailLoading() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Employees</p>
        <h1 className="text-2xl font-semibold text-ink">Edit Employee</h1>
      </div>
      <div className="panel max-w-3xl p-5 text-sm text-slate-600">Loading employee...</div>
    </AppShell>
  );
}
