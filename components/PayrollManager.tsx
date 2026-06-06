"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import { AlertTriangle, Calculator, CheckCircle2, Download, FileArchive, FileText, PlayCircle, Save, WalletCards } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CpfRateRule, Employee } from "@/types/database";

type PayrollStatus = "draft" | "approved" | "paid";

type PayrollPeriod = {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: PayrollStatus;
  created_at: string;
  updated_at: string;
};

type PayrollRecord = {
  id?: string;
  payroll_period_id: string;
  employee_id: string;
  basic_salary: number;
  hourly_rate: number;
  normal_hours: number;
  overtime_hours: number;
  overtime_rate: number;
  allowance: number;
  deduction: number;
  cpf_employee: number;
  cpf_employer: number;
  sdl: number;
  gross_pay: number;
  net_pay: number;
  employer_cost: number;
  remarks: string;
  status: PayrollStatus;
  employees?: Pick<Employee, "name" | "role"> | null;
};

type PayrollEmployee = Employee & {
  basic_salary?: number | null;
  hourly_rate?: number | null;
};

type PayrollManagerProps = {
  periods: PayrollPeriod[];
  employees: PayrollEmployee[];
  initialRecords: PayrollRecord[];
  cpfRules: CpfRateRule[];
};

type PeriodForm = {
  period_name: string;
  start_date: string;
  end_date: string;
};

const moneyFields = [
  "basic_salary",
  "hourly_rate",
  "overtime_rate",
  "allowance",
  "deduction",
  "cpf_employee",
  "cpf_employer",
  "sdl"
] as const;

type NumericField =
  | "basic_salary"
  | "hourly_rate"
  | "normal_hours"
  | "overtime_hours"
  | "overtime_rate"
  | "allowance"
  | "deduction"
  | "cpf_employee"
  | "cpf_employer"
  | "sdl";

type CpfSuggestion = {
  employeeCpf: number;
  employerCpf: number;
  employeeRate: number;
  employerRate: number;
  warnings: string[];
};

type CpfSuggestionMap = Record<string, CpfSuggestion>;

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function calculateRecord(record: PayrollRecord): PayrollRecord {
  const grossPay =
    toNumber(record.basic_salary) +
    toNumber(record.normal_hours) * toNumber(record.hourly_rate) +
    toNumber(record.overtime_hours) * toNumber(record.overtime_rate) +
    toNumber(record.allowance);
  const netPay = grossPay - toNumber(record.cpf_employee) - toNumber(record.deduction);
  const employerCost = grossPay + toNumber(record.cpf_employer) + toNumber(record.sdl);

  return {
    ...record,
    gross_pay: grossPay,
    net_pay: netPay,
    employer_cost: employerCost
  };
}

function makeRecord(periodId: string, employee: PayrollEmployee): PayrollRecord {
  return calculateRecord({
    payroll_period_id: periodId,
    employee_id: employee.id,
    basic_salary: toNumber(employee.basic_salary),
    hourly_rate: toNumber(employee.hourly_rate),
    normal_hours: 0,
    overtime_hours: 0,
    overtime_rate: 0,
    allowance: 0,
    deduction: 0,
    cpf_employee: 0,
    cpf_employer: 0,
    sdl: 0,
    gross_pay: 0,
    net_pay: 0,
    employer_cost: 0,
    remarks: "",
    status: "draft",
    employees: {
      name: employee.name,
      role: employee.role
    }
  });
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadCsv(headers: string[], rows: unknown[][], fileName: string) {
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), fileName);
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function createPayslipPdf(record: PayrollRecord, employee: PayrollEmployee | undefined, period: PayrollPeriod | null) {
  const doc = new jsPDF();
  const otPay = toNumber(record.overtime_hours) * toNumber(record.overtime_rate);

  doc.setFontSize(16);
  doc.text("Chosen Facility Services Pte Ltd", 14, 20);
  doc.setFontSize(13);
  doc.text("Payslip", 14, 31);
  doc.setFontSize(10);
  doc.text(`Employee Name: ${employee?.name ?? record.employees?.name ?? "Employee"}`, 14, 45);
  doc.text(`NRIC/FIN: ${employee?.nric_fin ?? "-"}`, 14, 53);
  doc.text(`Payroll Period: ${period?.period_name ?? "-"}`, 14, 61);

  const rows: [string, number][] = [
    ["Basic Salary", record.basic_salary],
    ["OT", otPay],
    ["Allowance", record.allowance],
    ["Deduction", record.deduction],
    ["CPF Employee", record.cpf_employee],
    ["CPF Employer", record.cpf_employer],
    ["SDL", record.sdl],
    ["Gross Pay", record.gross_pay],
    ["Net Pay", record.net_pay]
  ];

  let y = 80;
  rows.forEach(([label, value]) => {
    doc.text(label, 18, y);
    doc.text(formatCurrency(toNumber(value)), 150, y);
    y += 10;
  });

  return doc;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let current = index;
  for (let bit = 0; bit < 8; bit += 1) current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
  return current >>> 0;
});

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function createZip(files: { name: string; bytes: Uint8Array }[]) {
  const encoder = new TextEncoder();
  const output: number[] = [];
  const centralDirectory: number[] = [];

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const checksum = crc32(file.bytes);
    const offset = output.length;
    writeUint32(output, 0x04034b50); writeUint16(output, 20); writeUint16(output, 0); writeUint16(output, 0); writeUint16(output, 0); writeUint16(output, 0);
    writeUint32(output, checksum); writeUint32(output, file.bytes.length); writeUint32(output, file.bytes.length); writeUint16(output, nameBytes.length); writeUint16(output, 0);
    output.push(...nameBytes, ...file.bytes);
    writeUint32(centralDirectory, 0x02014b50); writeUint16(centralDirectory, 20); writeUint16(centralDirectory, 20); writeUint16(centralDirectory, 0); writeUint16(centralDirectory, 0); writeUint16(centralDirectory, 0); writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, checksum); writeUint32(centralDirectory, file.bytes.length); writeUint32(centralDirectory, file.bytes.length); writeUint16(centralDirectory, nameBytes.length); writeUint16(centralDirectory, 0); writeUint16(centralDirectory, 0); writeUint16(centralDirectory, 0); writeUint16(centralDirectory, 0); writeUint32(centralDirectory, 0); writeUint32(centralDirectory, offset);
    centralDirectory.push(...nameBytes);
  });

  const centralOffset = output.length;
  output.push(...centralDirectory);
  writeUint32(output, 0x06054b50); writeUint16(output, 0); writeUint16(output, 0); writeUint16(output, files.length); writeUint16(output, files.length); writeUint32(output, centralDirectory.length); writeUint32(output, centralOffset); writeUint16(output, 0);
  return new Blob([new Uint8Array(output)], { type: "application/zip" });
}
function calculateAge(dateOfBirth: string, asOfDate: string) {
  const dob = new Date(dateOfBirth);
  const asOf = new Date(asOfDate);
  let age = asOf.getFullYear() - dob.getFullYear();
  const monthDelta = asOf.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && asOf.getDate() < dob.getDate())) age -= 1;
  return age;
}

function findCpfRule(rules: CpfRateRule[], employee: PayrollEmployee, record: PayrollRecord, period: PayrollPeriod | null) {
  const warnings: string[] = [];

  if (!period) warnings.push("Select a payroll period.");
  if (!employee.date_of_birth) warnings.push("Missing date of birth.");
  if (!employee.citizenship_type) warnings.push("Missing citizenship type.");
  if (toNumber(record.gross_pay) <= 0) warnings.push("Gross pay must be above 0.");

  if (warnings.length || !period || !employee.date_of_birth || !employee.citizenship_type) {
    return { rule: null, warnings };
  }

  const payrollDate = period.end_date;
  const age = calculateAge(employee.date_of_birth, payrollDate);
  const wage = toNumber(record.gross_pay);
  const rule = rules.find((candidate) => {
    const effectiveFrom = candidate.effective_from <= payrollDate;
    const effectiveTo = !candidate.effective_to || candidate.effective_to >= payrollDate;
    const citizenshipMatches = candidate.citizenship_type === employee.citizenship_type;
    const ageMatches = age >= candidate.age_min && (candidate.age_max === null || age <= candidate.age_max);
    const wageMatches = wage > toNumber(candidate.wage_min) && (candidate.wage_max === null || wage <= toNumber(candidate.wage_max));
    return candidate.is_active && effectiveFrom && effectiveTo && citizenshipMatches && ageMatches && wageMatches;
  });

  if (!rule) warnings.push("No matching CPF rule.");

  return { rule: rule ?? null, warnings };
}

export default function PayrollManager({ periods, employees, initialRecords, cpfRules }: PayrollManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState(periods[0]?.id ?? "");
  const [periodForm, setPeriodForm] = useState<PeriodForm>({
    period_name: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10)
  });
  const [records, setRecords] = useState<PayrollRecord[]>(() => initialRecords.map(calculateRecord));
  const [cpfSuggestions, setCpfSuggestions] = useState<CpfSuggestionMap>({});

  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? null;
  const selectedRecords = records.filter((record) => record.payroll_period_id === selectedPeriodId);
  const employeesById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);

  const totals = useMemo(() => {
    return selectedRecords.reduce(
      (sum, record) => ({
        gross_pay: sum.gross_pay + toNumber(record.gross_pay),
        cpf_employee: sum.cpf_employee + toNumber(record.cpf_employee),
        cpf_employer: sum.cpf_employer + toNumber(record.cpf_employer),
        sdl: sum.sdl + toNumber(record.sdl),
        net_pay: sum.net_pay + toNumber(record.net_pay),
        employer_cost: sum.employer_cost + toNumber(record.employer_cost)
      }),
      {
        gross_pay: 0,
        cpf_employee: 0,
        cpf_employer: 0,
        sdl: 0,
        net_pay: 0,
        employer_cost: 0
      }
    );
  }, [selectedRecords]);

  const totalCpf = totals.cpf_employee + totals.cpf_employer;

  function getValidationWarnings(record: PayrollRecord) {
    const employee = employeesById.get(record.employee_id);
    const warnings: string[] = [];
    if (!employee?.bank_account) warnings.push("Missing Bank Account");
    if (!employee?.nric_fin) warnings.push("Missing NRIC/FIN");
    if (toNumber(record.cpf_employee) <= 0 || toNumber(record.cpf_employer) <= 0) warnings.push("Missing CPF Data");
    return warnings;
  }

  const validationWarnings = selectedRecords.flatMap((record) =>
    getValidationWarnings(record).map((warning) => ({ record, warning }))
  );
  function updatePeriodForm(field: keyof PeriodForm, value: string) {
    setPeriodForm((current) => ({ ...current, [field]: value }));
  }

  function updateRecord(employeeId: string, field: NumericField | "remarks", value: string) {
    setCpfSuggestions((current) => {
      if (!current[employeeId] || field === "remarks") return current;
      const next = { ...current };
      delete next[employeeId];
      return next;
    });

    setRecords((current) =>
      current.map((record) => {
        if (record.payroll_period_id !== selectedPeriodId || record.employee_id !== employeeId) return record;
        const next = {
          ...record,
          [field]: field === "remarks" ? value : toNumber(value)
        };
        return calculateRecord(next as PayrollRecord);
      })
    );
  }

  async function createPeriod(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("payroll_periods")
      .insert({
        period_name: periodForm.period_name,
        start_date: periodForm.start_date,
        end_date: periodForm.end_date,
        status: "draft"
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSelectedPeriodId(data.id);
    setSuccess("Payroll period created.");
    setPeriodForm((current) => ({ ...current, period_name: "" }));
    setLoading(false);
    router.refresh();
  }

  function generateRecords() {
    setError("");
    setSuccess("");
    setCpfSuggestions({});

    if (!selectedPeriodId) {
      setError("Please select or create a payroll period first.");
      return;
    }

    setRecords((current) => {
      const existingKeys = new Set(current.filter((record) => record.payroll_period_id === selectedPeriodId).map((record) => record.employee_id));
      const newRecords = employees.filter((employee) => !existingKeys.has(employee.id)).map((employee) => makeRecord(selectedPeriodId, employee));
      return [...current, ...newRecords];
    });
    setSuccess("Payroll records generated from active employees. Review and save them.");
  }

  function recalculate() {
    setCpfSuggestions({});
    setRecords((current) => current.map((record) => (record.payroll_period_id === selectedPeriodId ? calculateRecord(record) : record)));
    setSuccess("Payroll recalculated.");
    setError("");
  }

  function calculateCpfSuggestions() {
    setError("");
    setSuccess("");

    if (!selectedRecords.length) {
      setError("Generate payroll records before calculating CPF suggestions.");
      return;
    }

    const nextSuggestions: CpfSuggestionMap = {};

    selectedRecords.forEach((record) => {
      const employee = employeesById.get(record.employee_id);
      if (!employee) {
        nextSuggestions[record.employee_id] = {
          employeeCpf: 0,
          employerCpf: 0,
          employeeRate: 0,
          employerRate: 0,
          warnings: ["Employee profile not found."]
        };
        return;
      }

      const calculatedRecord = calculateRecord(record);
      const { rule, warnings } = findCpfRule(cpfRules, employee, calculatedRecord, selectedPeriod);

      if (!rule) {
        nextSuggestions[record.employee_id] = {
          employeeCpf: 0,
          employerCpf: 0,
          employeeRate: 0,
          employerRate: 0,
          warnings
        };
        return;
      }

      nextSuggestions[record.employee_id] = {
        employeeCpf: Math.round(toNumber(calculatedRecord.gross_pay) * toNumber(rule.employee_rate) * 100) / 100,
        employerCpf: Math.round(toNumber(calculatedRecord.gross_pay) * toNumber(rule.employer_rate) * 100) / 100,
        employeeRate: toNumber(rule.employee_rate),
        employerRate: toNumber(rule.employer_rate),
        warnings
      };
    });

    setCpfSuggestions(nextSuggestions);
    setSuccess("CPF suggestions calculated. Review before applying.");
  }

  function applyCpfSuggestion(employeeId: string) {
    const suggestion = cpfSuggestions[employeeId];
    if (!suggestion || suggestion.warnings.length) return;

    setRecords((current) =>
      current.map((record) => {
        if (record.payroll_period_id !== selectedPeriodId || record.employee_id !== employeeId) return record;
        return calculateRecord({
          ...record,
          cpf_employee: suggestion.employeeCpf,
          cpf_employer: suggestion.employerCpf
        });
      })
    );
    setSuccess("CPF suggestion applied. Save payroll records to keep changes.");
  }

  function applyAllCpfSuggestions() {
    if (!Object.keys(cpfSuggestions).length) {
      setError("Calculate CPF suggestions before applying them.");
      return;
    }

    setRecords((current) =>
      current.map((record) => {
        if (record.payroll_period_id !== selectedPeriodId) return record;
        const suggestion = cpfSuggestions[record.employee_id];
        if (!suggestion || suggestion.warnings.length) return record;
        return calculateRecord({
          ...record,
          cpf_employee: suggestion.employeeCpf,
          cpf_employer: suggestion.employerCpf
        });
      })
    );
    setSuccess("Applicable CPF suggestions applied. Save payroll records to keep changes.");
  }

  async function saveRecords() {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!selectedPeriodId || !selectedRecords.length) {
      setError("No payroll records to save.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const payload = selectedRecords.map((record) => {
      const calculated = calculateRecord(record);
      return {
        payroll_period_id: calculated.payroll_period_id,
        employee_id: calculated.employee_id,
        basic_salary: calculated.basic_salary,
        hourly_rate: calculated.hourly_rate,
        normal_hours: calculated.normal_hours,
        overtime_hours: calculated.overtime_hours,
        overtime_rate: calculated.overtime_rate,
        allowance: calculated.allowance,
        deduction: calculated.deduction,
        cpf_employee: calculated.cpf_employee,
        cpf_employer: calculated.cpf_employer,
        sdl: calculated.sdl,
        gross_pay: calculated.gross_pay,
        net_pay: calculated.net_pay,
        employer_cost: calculated.employer_cost,
        remarks: calculated.remarks || null,
        status: selectedPeriod?.status ?? calculated.status,
        updated_at: new Date().toISOString()
      };
    });

    const { error: saveError } = await supabase.from("payroll_records").upsert(payload, {
      onConflict: "payroll_period_id,employee_id"
    });

    if (saveError) {
      setError(saveError.message);
      setLoading(false);
      return;
    }

    setSuccess("Payroll records saved.");
    setLoading(false);
    router.refresh();
  }

  async function updatePeriodStatus(status: PayrollStatus) {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!selectedPeriodId) {
      setError("Please select a payroll period first.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: periodError } = await supabase
      .from("payroll_periods")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", selectedPeriodId);

    if (periodError) {
      setError(periodError.message);
      setLoading(false);
      return;
    }

    await supabase
      .from("payroll_records")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("payroll_period_id", selectedPeriodId);

    setSuccess(`Payroll marked as ${status}.`);
    setLoading(false);
    router.refresh();
  }

  function payrollExportRows() {
    return selectedRecords.map((record) => {
      const employee = employeesById.get(record.employee_id);
      const otPay = toNumber(record.overtime_hours) * toNumber(record.overtime_rate);
      return [
        employee?.name ?? record.employees?.name ?? "",
        employee?.nric_fin ?? "",
        employee?.bank_name ?? "",
        employee?.bank_account ?? "",
        record.basic_salary,
        otPay,
        record.allowance,
        record.deduction,
        record.cpf_employee,
        record.cpf_employer,
        record.sdl,
        record.gross_pay,
        record.net_pay,
        record.employer_cost
      ];
    });
  }

  function exportCsv() {
    downloadCsv(
      ["Employee Name", "NRIC/FIN", "Bank Name", "Bank Account", "Basic Salary", "OT", "Allowance", "Deduction", "CPF Employee", "CPF Employer", "SDL", "Gross Pay", "Net Pay", "Employer Cost"],
      payrollExportRows(),
      `payroll-${selectedPeriod?.period_name ?? "period"}.csv`
    );
  }

  function exportBankGiroCsv() {
    downloadCsv(
      ["Employee Name", "Bank Name", "Bank Account", "Net Pay"],
      selectedRecords.map((record) => {
        const employee = employeesById.get(record.employee_id);
        return [employee?.name ?? record.employees?.name ?? "", employee?.bank_name ?? "", employee?.bank_account ?? "", record.net_pay];
      }),
      `bank-giro-${selectedPeriod?.period_name ?? "period"}.csv`
    );
  }

  function exportPayslip(record: PayrollRecord) {
    const employee = employeesById.get(record.employee_id);
    const doc = createPayslipPdf(record, employee, selectedPeriod);
    doc.save(`payslip-${sanitizeFileName(selectedPeriod?.period_name ?? "period")}-${sanitizeFileName(employee?.name ?? record.employees?.name ?? "employee")}.pdf`);
  }

  function exportBulkPayslips() {
    if (!selectedRecords.length) return;
    const files = selectedRecords.map((record) => {
      const employee = employeesById.get(record.employee_id);
      const doc = createPayslipPdf(record, employee, selectedPeriod);
      return {
        name: `payslip-${sanitizeFileName(employee?.name ?? record.employees?.name ?? "employee")}.pdf`,
        bytes: new Uint8Array(doc.output("arraybuffer"))
      };
    });
    downloadBlob(createZip(files), `payslips-${sanitizeFileName(selectedPeriod?.period_name ?? "period")}.zip`);
  }
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="panel p-5">
          <h2 className="font-semibold text-ink">Payroll Period</h2>
          <form className="mt-4 space-y-4" onSubmit={createPeriod}>
            <div>
              <label className="label">Period Name</label>
              <input
                className="field mt-1"
                placeholder="June 2026"
                value={periodForm.period_name}
                onChange={(event) => updatePeriodForm("period_name", event.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start Date</label>
                <input className="field mt-1" type="date" value={periodForm.start_date} onChange={(event) => updatePeriodForm("start_date", event.target.value)} required />
              </div>
              <div>
                <label className="label">End Date</label>
                <input className="field mt-1" type="date" value={periodForm.end_date} onChange={(event) => updatePeriodForm("end_date", event.target.value)} required />
              </div>
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              <WalletCards size={16} />
              Create Period
            </button>
          </form>
        </section>

        <section className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-ink">Selected Payroll</h2>
              <p className="mt-1 text-sm text-slate-500">Generate, review, approve, pay, and export payroll.</p>
            </div>
            <span className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium capitalize text-slate-600">{selectedPeriod?.status ?? "No period"}</span>
          </div>

          <div className="mt-4">
            <label className="label">Payroll Period</label>
            <select
              className="field mt-1"
              value={selectedPeriodId}
              onChange={(event) => {
                setSelectedPeriodId(event.target.value);
                setCpfSuggestions({});
              }}
            >
              <option value="">Select period</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.period_name} ({formatDate(period.start_date)} - {formatDate(period.end_date)})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button className="btn-secondary" type="button" onClick={generateRecords} disabled={!selectedPeriodId || loading}>
              <PlayCircle size={16} />
              Generate
            </button>
            <button className="btn-secondary" type="button" onClick={recalculate} disabled={!selectedPeriodId || loading}>
              Recalculate
            </button>
            <button className="btn-secondary" type="button" onClick={calculateCpfSuggestions} disabled={!selectedPeriodId || loading}>
              <Calculator size={16} />
              CPF Suggestion
            </button>
            <button className="btn-primary" type="button" onClick={saveRecords} disabled={!selectedPeriodId || loading}>
              <Save size={16} />
              Save
            </button>

          </div>


          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-secondary" type="button" onClick={exportCsv} disabled={!selectedRecords.length}>
              <Download size={16} />
              Payroll CSV
            </button>
            <button className="btn-secondary" type="button" onClick={exportBankGiroCsv} disabled={!selectedRecords.length}>
              <Download size={16} />
              Bank GIRO CSV
            </button>
            <button className="btn-secondary" type="button" onClick={exportBulkPayslips} disabled={!selectedRecords.length}>
              <FileArchive size={16} />
              Bulk Payslips ZIP
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-secondary" type="button" onClick={() => updatePeriodStatus("approved")} disabled={!selectedPeriodId || loading}>
              <CheckCircle2 size={16} />
              Approve Payroll
            </button>
            <button className="btn-secondary" type="button" onClick={applyAllCpfSuggestions} disabled={!selectedRecords.length || !Object.keys(cpfSuggestions).length || loading}>
              Apply CPF to All
            </button>
            <button className="btn-primary" type="button" onClick={() => updatePeriodStatus("paid")} disabled={!selectedPeriodId || loading}>
              Mark Paid
            </button>
          </div>

          {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="mt-4 rounded-md bg-teal-50 px-3 py-2 text-sm text-brand">{success}</p> : null}
        </section>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-4">
          <p className="label">Total Payroll Cost</p>
          <p className="mt-2 font-semibold">{formatCurrency(totals.employer_cost)}</p>
        </div>
        <div className="panel p-4">
          <p className="label">Total CPF</p>
          <p className="mt-2 font-semibold">{formatCurrency(totalCpf)}</p>
        </div>
        <div className="panel p-4">
          <p className="label">Total SDL</p>
          <p className="mt-2 font-semibold">{formatCurrency(totals.sdl)}</p>
        </div>
        <div className="panel p-4">
          <p className="label">Total Net Salary</p>
          <p className="mt-2 font-semibold">{formatCurrency(totals.net_pay)}</p>
        </div>
      </section>

      {validationWarnings.length ? (
        <section className="panel p-5">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={18} />
            <h2 className="font-semibold">Payroll Export Validation</h2>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {validationWarnings.map(({ record, warning }, index) => {
              const employee = employeesById.get(record.employee_id);
              return (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800" key={`${record.employee_id}-${warning}-${index}`}>
                  {(employee?.name ?? record.employees?.name ?? "Employee")}: {warning}
                </p>
              );
            })}
          </div>
        </section>
      ) : null}
      <section className="space-y-4">
        {selectedRecords.map((record) => {
          const employee = employeesById.get(record.employee_id);
          const recordWarnings = getValidationWarnings(record);
          const cpfSuggestion = cpfSuggestions[record.employee_id];
          const hasCpfWarnings = Boolean(cpfSuggestion?.warnings.length);

          return (
          <article className="panel p-5" key={`${record.payroll_period_id}-${record.employee_id}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-ink">{record.employees?.name ?? "Employee"}</h3>
                <p className="mt-1 text-sm capitalize text-slate-500">{String(record.employees?.role ?? "-").replace(/_/g, " ")}</p>
              </div>
              <div className="text-right">
                <p className="label">Net Pay</p>
                <p className="font-semibold text-ink">{formatCurrency(record.net_pay)}</p>
              </div>
            </div>

            {recordWarnings.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {recordWarnings.map((warning) => (
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800" key={warning}>{warning}</span>
                ))}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              {[
                ["basic_salary", "Basic Salary"],
                ["hourly_rate", "Hourly Rate"],
                ["normal_hours", "Normal Hours"],
                ["overtime_hours", "OT Hours"],
                ["overtime_rate", "OT Rate"],
                ["allowance", "Allowance"],
                ["deduction", "Deduction"],
                ["cpf_employee", "CPF Employee"],
                ["cpf_employer", "CPF Employer"],
                ["sdl", "SDL"]
              ].map(([field, label]) => {
                const isEmployeeCpf = field === "cpf_employee";
                const isEmployerCpf = field === "cpf_employer";
                const suggestedValue = isEmployeeCpf ? cpfSuggestion?.employeeCpf : isEmployerCpf ? cpfSuggestion?.employerCpf : null;
                const suggestedRate = isEmployeeCpf ? cpfSuggestion?.employeeRate : isEmployerCpf ? cpfSuggestion?.employerRate : null;

                return (
                  <div key={field}>
                    <label className="label">{label}</label>
                    <input
                      className="field mt-1"
                      type="number"
                      step={moneyFields.includes(field as (typeof moneyFields)[number]) ? "0.01" : "0.25"}
                      value={String(record[field as NumericField])}
                      onChange={(event) => updateRecord(record.employee_id, field as NumericField, event.target.value)}
                    />
                    {(isEmployeeCpf || isEmployerCpf) && cpfSuggestion && !hasCpfWarnings ? (
                      <p className="mt-1 text-xs text-brand">
                        Suggested: {formatCurrency(suggestedValue ?? 0)} ({Math.round(toNumber(suggestedRate) * 1000) / 10}%)
                      </p>
                    ) : null}
                  </div>
                );
              })}
              <div className="sm:col-span-2 lg:col-span-4 xl:col-span-6">
                <label className="label">Remarks</label>
                <input className="field mt-1" value={record.remarks ?? ""} onChange={(event) => updateRecord(record.employee_id, "remarks", event.target.value)} />
              </div>
            </div>

            {cpfSuggestion ? (
              <div className={`mt-4 rounded-md px-3 py-2 text-sm ${hasCpfWarnings ? "bg-amber-50 text-amber-800" : "bg-teal-50 text-brand"}`}>
                {hasCpfWarnings ? (
                  <div>
                    <p className="font-medium">CPF suggestion warning</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {cpfSuggestion.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p>
                      Suggested CPF: Employee {formatCurrency(cpfSuggestion.employeeCpf)}, Employer {formatCurrency(cpfSuggestion.employerCpf)}
                    </p>
                    <button className="btn-secondary bg-white" type="button" onClick={() => applyCpfSuggestion(record.employee_id)}>
                      Apply Suggested CPF
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
              <div>
                <span className="text-slate-500">Gross Pay</span>
                <p className="font-semibold">{formatCurrency(record.gross_pay)}</p>
              </div>
              <div>
                <span className="text-slate-500">Net Pay</span>
                <p className="font-semibold">{formatCurrency(record.net_pay)}</p>
              </div>
              <div>
                <span className="text-slate-500">Employer Cost</span>
                <p className="font-semibold">{formatCurrency(record.employer_cost)}</p>
              </div>
              <div>
                <button className="btn-secondary w-full" type="button" onClick={() => exportPayslip(record)}>
                  <FileText size={16} />
                  Payslip PDF
                </button>
              </div>
            </div>
          </article>
          );
        })}

        {!selectedRecords.length ? (
          <div className="panel p-6 text-sm text-slate-500">
            Select a period and generate payroll records from active employees.
          </div>
        ) : null}
      </section>
    </div>
  );
}










