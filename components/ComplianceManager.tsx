import Link from "next/link";
import { Mail, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { Employee } from "@/types/database";

type ComplianceManagerProps = {
  employees: Employee[];
};

const complianceFields = [
  { key: "work_permit_expiry", label: "Work Permit" },
  { key: "passport_expiry", label: "Passport" },
  { key: "medical_expiry", label: "Medical" },
  { key: "wsq_expiry", label: "WSQ" },
  { key: "first_aid_expiry", label: "First Aid" }
] as const;

type ComplianceFieldKey = (typeof complianceFields)[number]["key"];

type ComplianceAlert = {
  employee: Employee;
  field: ComplianceFieldKey;
  label: string;
  expiry: string;
  daysLeft: number;
};

function daysUntil(value: string | null | undefined) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(value);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getAlerts(employees: Employee[]) {
  const alerts: ComplianceAlert[] = [];

  employees.forEach((employee) => {
    complianceFields.forEach((field) => {
      const expiry = employee[field.key];
      const daysLeft = daysUntil(expiry);
      if (expiry && daysLeft !== null && daysLeft <= 90) {
        alerts.push({
          employee,
          field: field.key,
          label: field.label,
          expiry,
          daysLeft
        });
      }
    });
  });

  return alerts.sort((first, second) => first.daysLeft - second.daysLeft);
}

function groupLabel(daysLeft: number) {
  if (daysLeft <= 30) return "30 Days";
  if (daysLeft <= 60) return "60 Days";
  return "90 Days";
}

function groupClass(daysLeft: number) {
  if (daysLeft <= 30) return "bg-red-50 text-red-700";
  if (daysLeft <= 60) return "bg-amber-50 text-amber-800";
  return "bg-teal-50 text-brand";
}

function reminderHref(alert: ComplianceAlert) {
  const subject = encodeURIComponent(`${alert.label} expiry reminder - ${alert.employee.name}`);
  const body = encodeURIComponent(
    `Hi ${alert.employee.name},\n\nThis is a reminder that your ${alert.label} expires on ${formatDate(alert.expiry)}.\n\nPlease submit the renewal documents to your supervisor.\n\nChosen Operations System`
  );
  return `mailto:${alert.employee.email ?? ""}?subject=${subject}&body=${body}`;
}

export default function ComplianceManager({ employees }: ComplianceManagerProps) {
  const alerts = getAlerts(employees);
  const groups = [
    { label: "30 Days", alerts: alerts.filter((alert) => alert.daysLeft <= 30) },
    { label: "60 Days", alerts: alerts.filter((alert) => alert.daysLeft > 30 && alert.daysLeft <= 60) },
    { label: "90 Days", alerts: alerts.filter((alert) => alert.daysLeft > 60 && alert.daysLeft <= 90) }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {groups.map((group) => (
          <div className="panel p-5" key={group.label}>
            <p className="label">{group.label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{group.alerts.length}</p>
            <p className="mt-1 text-sm text-slate-500">Compliance alerts</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        {alerts.map((alert) => (
          <article className="panel p-5" key={`${alert.employee.id}-${alert.field}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className={`rounded-md p-2 ${groupClass(alert.daysLeft)}`}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-ink">{alert.employee.name}</h2>
                  <p className="mt-1 text-sm capitalize text-slate-500">{String(alert.employee.role).replace(/_/g, " ")}</p>
                </div>
              </div>
              <span className={`rounded-md px-3 py-2 text-sm font-medium ${groupClass(alert.daysLeft)}`}>
                {groupLabel(alert.daysLeft)}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="label">Document</p>
                <p className="mt-1 font-medium text-ink">{alert.label}</p>
              </div>
              <div>
                <p className="label">Expiry</p>
                <p className="mt-1 font-medium text-ink">{formatDate(alert.expiry)}</p>
              </div>
              <div>
                <p className="label">Days Left</p>
                <p className="mt-1 font-medium text-ink">{alert.daysLeft < 0 ? `${Math.abs(alert.daysLeft)} overdue` : alert.daysLeft}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="btn-secondary" href={`/employees/${alert.employee.id}`}>
                Edit Employee
              </Link>
              <a className="btn-primary" href={reminderHref(alert)}>
                <Mail size={16} />
                Email Reminder
              </a>
            </div>
          </article>
        ))}

        {!alerts.length ? <div className="panel p-6 text-sm text-slate-500">No compliance alerts within 90 days.</div> : null}
      </section>
    </div>
  );
}
