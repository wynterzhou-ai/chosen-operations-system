alter table public.employees
add column if not exists nric_fin text,
add column if not exists payment_method text not null default 'bank_giro',
add column if not exists bank_branch text;

alter table public.employees
drop constraint if exists employees_payment_method_check;

alter table public.employees
add constraint employees_payment_method_check
check (payment_method in ('bank_giro', 'cash', 'cheque', 'paynow'));
