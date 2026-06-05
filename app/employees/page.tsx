import Link from "next/link";
import { Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Employee } from "@/types/database";

export default async function EmployeesPage() {
  const supabase = createClient();
  const { data } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
  const employees = (data ?? []) as Employee[];

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="label">Records</p>
          <h1 className="text-2xl font-semibold text-ink">Employees</h1>
        </div>
        <Link className="btn-primary" href="/employees/new">
          <Plus size={16} />
          New Employee
        </Link>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link className="text-brand hover:underline" href={`/employees/${employee.id}`}>
                    {employee.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{employee.role}</td>
                <td className="px-4 py-3">{employee.phone ?? "-"}</td>
                <td className="px-4 py-3 capitalize">{employee.status}</td>
                <td className="px-4 py-3">{formatDate(employee.created_at)}</td>
              </tr>
            ))}
            {!employees.length ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  No employees yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
