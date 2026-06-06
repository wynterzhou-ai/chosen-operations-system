"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CitizenshipType, Employee, EmployeeRole } from "@/types/database";

type EmployeeFormProps = {
  employee?: Employee;
};

const employeeRoles: { value: EmployeeRole; label: string }[] = [
  { value: "cleaner", label: "Cleaner" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operations_manager", label: "Operations Manager" },
  { value: "admin", label: "Admin" }
];

const citizenshipTypes: { value: CitizenshipType; label: string }[] = [
  { value: "singapore_citizen", label: "Singapore Citizen" },
  { value: "spr_year_1", label: "SPR Year 1" },
  { value: "spr_year_2", label: "SPR Year 2" },
  { value: "spr_year_3_plus", label: "SPR Year 3+" }
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
    basic_salary: String(employee?.basic_salary ?? 0),
    hourly_rate: String(employee?.hourly_rate ?? 0),
    cpf_applicable: employee?.cpf_applicable ?? true,
    sdl_applicable: employee?.sdl_applicable ?? true,
    bank_name: employee?.bank_name ?? "",
    bank_account: employee?.bank_account ?? "",
    nric_fin: employee?.nric_fin ?? "",
    payment_method: employee?.payment_method ?? "bank_giro",
    bank_branch: employee?.bank_branch ?? "",
    pwm_grade: employee?.pwm_grade ?? "",
    date_of_birth: employee?.date_of_birth ?? "",
    citizenship_type: employee?.citizenship_type ?? "singapore_citizen",
    cpf_auto_calculation: employee?.cpf_auto_calculation ?? false,
    work_permit_expiry: employee?.work_permit_expiry ?? "",
    passport_expiry: employee?.passport_expiry ?? "",
    medical_expiry: employee?.medical_expiry ?? "",
    wsq_expiry: employee?.wsq_expiry ?? "",
    first_aid_expiry: employee?.first_aid_expiry ?? "",
    status: employee?.status ?? "active"
  });

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const payload = {
      ...form,
      basic_salary: Number(form.basic_salary) || 0,
      hourly_rate: Number(form.hourly_rate) || 0,
      email: form.email || null,
      phone: form.phone || null,
      bank_name: form.bank_name || null,
      bank_account: form.bank_account || null,
      nric_fin: form.nric_fin || null,
      payment_method: form.payment_method || "bank_giro",
      bank_branch: form.bank_branch || null,
      pwm_grade: form.pwm_grade || null,
      date_of_birth: form.date_of_birth || null,
      citizenship_type: form.citizenship_type || "singapore_citizen",
      cpf_auto_calculation: form.cpf_auto_calculation,
      work_permit_expiry: form.work_permit_expiry || null,
      passport_expiry: form.passport_expiry || null,
      medical_expiry: form.medical_expiry || null,
      wsq_expiry: form.wsq_expiry || null,
      first_aid_expiry: form.first_aid_expiry || null
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

      <div className="border-t border-line pt-4">
        <h2 className="font-semibold text-ink">Payroll Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Basic Salary</label>
            <input
              className="field mt-1"
              type="number"
              min="0"
              step="0.01"
              value={form.basic_salary}
              onChange={(event) => updateField("basic_salary", event.target.value)}
            />
          </div>
          <div>
            <label className="label">Hourly Rate</label>
            <input
              className="field mt-1"
              type="number"
              min="0"
              step="0.01"
              value={form.hourly_rate}
              onChange={(event) => updateField("hourly_rate", event.target.value)}
            />
          </div>
          <div>
            <label className="label">CPF Applicable</label>
            <select
              className="field mt-1"
              value={form.cpf_applicable ? "true" : "false"}
              onChange={(event) => updateField("cpf_applicable", event.target.value === "true")}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="label">SDL Applicable</label>
            <select
              className="field mt-1"
              value={form.sdl_applicable ? "true" : "false"}
              onChange={(event) => updateField("sdl_applicable", event.target.value === "true")}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div>
            <label className="label">Bank Name</label>
            <input className="field mt-1" value={form.bank_name} onChange={(event) => updateField("bank_name", event.target.value)} />
          </div>

          <div>
            <label className="label">Bank Account</label>
            <input className="field mt-1" value={form.bank_account} onChange={(event) => updateField("bank_account", event.target.value)} />
          </div>
          <div>
            <label className="label">PWM Grade</label>
            <input className="field mt-1" value={form.pwm_grade} onChange={(event) => updateField("pwm_grade", event.target.value)} />
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input className="field mt-1" type="date" value={form.date_of_birth} onChange={(event) => updateField("date_of_birth", event.target.value)} />
          </div>
          <div>
            <label className="label">Citizenship Type</label>
            <select className="field mt-1" value={form.citizenship_type} onChange={(event) => updateField("citizenship_type", event.target.value)}>
              {citizenshipTypes.map((citizenship) => (
                <option key={citizenship.value} value={citizenship.value}>
                  {citizenship.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">CPF Auto Calculation</label>
            <select
              className="field mt-1"
              value={form.cpf_auto_calculation ? "true" : "false"}
              onChange={(event) => updateField("cpf_auto_calculation", event.target.value === "true")}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-line pt-4">
        <h2 className="font-semibold text-ink">Payroll Export Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">NRIC / FIN</label>
            <input className="field mt-1" value={form.nric_fin} onChange={(event) => updateField("nric_fin", event.target.value)} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="field mt-1" value={form.payment_method} onChange={(event) => updateField("payment_method", event.target.value)}>
              <option value="bank_giro">Bank GIRO</option>
              <option value="paynow">PayNow</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div>
            <label className="label">Bank Branch</label>
            <input className="field mt-1" value={form.bank_branch} onChange={(event) => updateField("bank_branch", event.target.value)} />
          </div>
        </div>
      </div>
      <div className="border-t border-line pt-4">
        <h2 className="font-semibold text-ink">Compliance Expiries</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Work Permit Expiry</label>
            <input className="field mt-1" type="date" value={form.work_permit_expiry} onChange={(event) => updateField("work_permit_expiry", event.target.value)} />
          </div>
          <div>
            <label className="label">Passport Expiry</label>
            <input className="field mt-1" type="date" value={form.passport_expiry} onChange={(event) => updateField("passport_expiry", event.target.value)} />
          </div>
          <div>
            <label className="label">Medical Expiry</label>
            <input className="field mt-1" type="date" value={form.medical_expiry} onChange={(event) => updateField("medical_expiry", event.target.value)} />
          </div>
          <div>
            <label className="label">WSQ Expiry</label>
            <input className="field mt-1" type="date" value={form.wsq_expiry} onChange={(event) => updateField("wsq_expiry", event.target.value)} />
          </div>
          <div>
            <label className="label">First Aid Expiry</label>
            <input className="field mt-1" type="date" value={form.first_aid_expiry} onChange={(event) => updateField("first_aid_expiry", event.target.value)} />
          </div>
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


