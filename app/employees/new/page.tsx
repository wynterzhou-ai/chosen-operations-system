import AppShell from "@/components/AppShell";
import EmployeeForm from "@/components/EmployeeForm";

export default function NewEmployeePage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Employees</p>
        <h1 className="text-2xl font-semibold text-ink">New Employee</h1>
      </div>
      <EmployeeForm />
    </AppShell>
  );
}
