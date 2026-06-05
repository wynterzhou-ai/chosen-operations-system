create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  role text not null default 'cleaner' check (role in ('cleaner', 'supervisor', 'operations_manager', 'admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

alter table public.employees alter column role set default 'cleaner';

update public.employees
set role = case
  when lower(role) = 'cleaner' then 'cleaner'
  when lower(role) = 'supervisor' then 'supervisor'
  when lower(role) in ('operations manager', 'operations_manager') then 'operations_manager'
  when lower(role) = 'admin' then 'admin'
  else 'cleaner'
end;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.employees'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.employees drop constraint %I', constraint_record.conname);
  end loop;

  alter table public.employees
    add constraint employees_role_check
    check (role in ('cleaner', 'supervisor', 'operations_manager', 'admin'));
end $$;

create table if not exists public.rosters (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  roster_id uuid references public.rosters(id) on delete set null,
  check_in_time timestamptz not null,
  check_out_time timestamptz,
  check_in_lat numeric,
  check_in_lng numeric,
  check_out_lat numeric,
  check_out_lng numeric,
  check_in_photo_url text,
  check_out_photo_url text,
  remarks text,
  status text not null default 'checked_in' check (status in ('checked_in', 'checked_out', 'issue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inspection_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  inspected_by text,
  inspection_date date not null,
  score numeric not null default 0,
  notes text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  client_id uuid not null references public.clients(id) on delete cascade,
  issue_date date not null,
  valid_until date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric not null default 0
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  quotation_id uuid references public.quotations(id) on delete set null,
  client_id uuid not null references public.clients(id) on delete cascade,
  issue_date date not null,
  due_date date,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid', 'overdue')),
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric not null default 0
);

alter table public.clients enable row level security;
alter table public.employees enable row level security;
alter table public.rosters enable row level security;
alter table public.attendance_records enable row level security;
alter table public.inspection_reports enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

create policy "Authenticated users manage clients" on public.clients for all to authenticated using (true) with check (true);
create policy "Authenticated users manage employees" on public.employees for all to authenticated using (true) with check (true);
create policy "Authenticated users manage rosters" on public.rosters for all to authenticated using (true) with check (true);
create policy "Authenticated users manage attendance records" on public.attendance_records for all to authenticated using (true) with check (true);
create policy "Authenticated users manage inspection reports" on public.inspection_reports for all to authenticated using (true) with check (true);
create policy "Authenticated users manage quotations" on public.quotations for all to authenticated using (true) with check (true);
create policy "Authenticated users manage quotation items" on public.quotation_items for all to authenticated using (true) with check (true);
create policy "Authenticated users manage invoices" on public.invoices for all to authenticated using (true) with check (true);
create policy "Authenticated users manage invoice items" on public.invoice_items for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', true)
on conflict (id) do update set public = true;

create policy "Authenticated users upload inspection photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'inspection-photos');

create policy "Public inspection photos are readable"
on storage.objects for select to public
using (bucket_id = 'inspection-photos');

create policy "Authenticated users update inspection photos"
on storage.objects for update to authenticated
using (bucket_id = 'inspection-photos')
with check (bucket_id = 'inspection-photos');

create policy "Authenticated users delete inspection photos"
on storage.objects for delete to authenticated
using (bucket_id = 'inspection-photos');

insert into storage.buckets (id, name, public)
values ('attendance-photos', 'attendance-photos', true)
on conflict (id) do update set public = true;

create policy "Authenticated users upload attendance photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'attendance-photos');

create policy "Public attendance photos are readable"
on storage.objects for select to public
using (bucket_id = 'attendance-photos');

create policy "Authenticated users update attendance photos"
on storage.objects for update to authenticated
using (bucket_id = 'attendance-photos')
with check (bucket_id = 'attendance-photos');

create policy "Authenticated users delete attendance photos"
on storage.objects for delete to authenticated
using (bucket_id = 'attendance-photos');
