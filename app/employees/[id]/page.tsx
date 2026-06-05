import AppShell from "@/components/AppShell";
import EmployeeForm from "@/components/EmployeeForm";
import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/types/database";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function EmployeePageError({ message }: { message: string }) {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Employees</p>
        <h1 className="text-2xl font-semibold text-ink">Edit Employee</h1>
      </div>
      <div className="panel max-w-3xl p-5">
        <p className="font-semibold text-ink">Unable to load employee</p>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
      </div>
    </AppShell>
  );
}

export default async function EmployeeDetailPage({ params }: { params: { id?: string } }) {
  const id = params.id ? decodeURIComponent(params.id) : "";

  if (!uuidPattern.test(id)) {
    return <EmployeePageError message="The employee link is invalid. Please return to the employees list and try again." />;
  }

  const supabase = createClient();
  const { data, error } = await supabase.from("employees").select("*").eq("id", id).maybeSingle();

  if (error) {
    return <EmployeePageError message={error.message} />;
  }

  if (!data) {
    return <EmployeePageError message="This employee could not be found. It may have been deleted." />;
  }

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Employees</p>
        <h1 className="text-2xl font-semibold text-ink">Edit Employee</h1>
      </div>
      <EmployeeForm employee={data as Employee} />
    </AppShell>
  );
}
