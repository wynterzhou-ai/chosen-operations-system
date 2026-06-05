"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Employee, EmployeeRole } from "@/types/database";

type EmployeeFormProps = {
  employee?: Employee;
};

const employeeRoles: { value: EmployeeRole; label: string }[] = [
  { value: "cleaner", label: "Cleaner" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operations_manager", label: "Operations Manager" },
  { value: "admin", label: "Admin" }
];

function normalizeRole(role: string | null | undefined): EmployeeRole {
  const normalized = String(role ?? "cleaner").toLowerCase();
  return employeeRoles.some((item) => item.value === normalized) ? (normalized as EmployeeRole) : "cleaner";
}

export default function EmployeeForm({ employee }: EmployeeFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: employee?.name ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    role: normalizeRole(employee?.role),
    status: employee?.status ?? "active"
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
      email: form.email || null,
      phone: form.phone || null
    };

    const result = employee
      ? await supabase.from("employees").update(payload).eq("id", employee.id)
      : await supabase.from("employees").insert(payload);

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    router.push("/employees");
    router.refresh();
  }

  async function remove() {
    if (!employee || !confirm("Delete this employee?")) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("employees").delete().eq("id", employee.id);
    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }
    router.push("/employees");
    router.refresh();
  }

  return (
    <form className="panel max-w-3xl space-y-4 p-5" onSubmit={save}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Employee Name</label>
          <input className="field mt-1" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="field mt-1" value={form.role} onChange={(event) => updateField("role", event.target.value)} required>
            {employeeRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
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

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save Employee"}
        </button>
        {employee ? (
          <button className="btn-danger" type="button" onClick={remove} disabled={loading}>
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
