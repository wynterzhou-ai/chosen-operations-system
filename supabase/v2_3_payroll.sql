create table if not exists public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  period_name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_records (
  id uuid primary key default gen_random_uuid(),
  payroll_period_id uuid not null references public.payroll_periods(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  basic_salary numeric not null default 0,
  hourly_rate numeric not null default 0,
  normal_hours numeric not null default 0,
  overtime_hours numeric not null default 0,
  overtime_rate numeric not null default 0,
  allowance numeric not null default 0,
  deduction numeric not null default 0,
  cpf_employee numeric not null default 0,
  cpf_employer numeric not null default 0,
  sdl numeric not null default 0,
  gross_pay numeric not null default 0,
  net_pay numeric not null default 0,
  employer_cost numeric not null default 0,
  remarks text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payroll_periods_status_idx
on public.payroll_periods (status);

create index if not exists payroll_periods_start_end_idx
on public.payroll_periods (start_date, end_date);

create index if not exists payroll_records_period_id_idx
on public.payroll_records (payroll_period_id);

create index if not exists payroll_records_employee_id_idx
on public.payroll_records (employee_id);

create index if not exists payroll_records_status_idx
on public.payroll_records (status);

create unique index if not exists payroll_records_period_employee_uidx
on public.payroll_records (payroll_period_id, employee_id);

alter table public.payroll_periods enable row level security;
alter table public.payroll_records enable row level security;

create policy "Authenticated users manage payroll periods"
on public.payroll_periods
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users manage payroll records"
on public.payroll_records
for all
to authenticated
using (true)
with check (true);
