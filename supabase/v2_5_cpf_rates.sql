create table if not exists public.cpf_rate_rules (
  id uuid primary key default gen_random_uuid(),
  effective_from date not null,
  effective_to date,
  citizenship_type text not null check (citizenship_type in ('singapore_citizen', 'spr_year_1', 'spr_year_2', 'spr_year_3_plus')),
  age_min integer not null,
  age_max integer,
  wage_min numeric not null default 0,
  wage_max numeric,
  employer_rate numeric not null,
  employee_rate numeric not null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists cpf_rate_rules_active_idx
on public.cpf_rate_rules (is_active);

create index if not exists cpf_rate_rules_effective_idx
on public.cpf_rate_rules (effective_from, effective_to);

create index if not exists cpf_rate_rules_citizenship_age_idx
on public.cpf_rate_rules (citizenship_type, age_min, age_max);

alter table public.cpf_rate_rules enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cpf_rate_rules'
      and policyname = 'Authenticated users manage cpf rate rules'
  ) then
    create policy "Authenticated users manage cpf rate rules"
    on public.cpf_rate_rules
    for all
    to authenticated
    using (true)
    with check (true);
  end if;
end $$;

alter table public.employees
add column if not exists date_of_birth date,
add column if not exists citizenship_type text not null default 'singapore_citizen',
add column if not exists cpf_auto_calculation boolean not null default false;

alter table public.employees
drop constraint if exists employees_citizenship_type_check;

alter table public.employees
add constraint employees_citizenship_type_check
check (citizenship_type in ('singapore_citizen', 'spr_year_1', 'spr_year_2', 'spr_year_3_plus'));

insert into public.cpf_rate_rules (
  effective_from,
  effective_to,
  citizenship_type,
  age_min,
  age_max,
  wage_min,
  wage_max,
  employer_rate,
  employee_rate,
  is_active,
  notes
)
select *
from (
  values
    ('2026-01-01'::date, null::date, 'singapore_citizen', 0, 55, 750::numeric, null::numeric, 0.17::numeric, 0.20::numeric, true, '2026 CPF rate, monthly wages above 750'),
    ('2026-01-01'::date, null::date, 'singapore_citizen', 56, 60, 750::numeric, null::numeric, 0.16::numeric, 0.18::numeric, true, '2026 CPF rate, monthly wages above 750'),
    ('2026-01-01'::date, null::date, 'singapore_citizen', 61, 65, 750::numeric, null::numeric, 0.125::numeric, 0.125::numeric, true, '2026 CPF rate, monthly wages above 750'),
    ('2026-01-01'::date, null::date, 'singapore_citizen', 66, 70, 750::numeric, null::numeric, 0.09::numeric, 0.075::numeric, true, '2026 CPF rate, monthly wages above 750'),
    ('2026-01-01'::date, null::date, 'singapore_citizen', 71, null::integer, 750::numeric, null::numeric, 0.075::numeric, 0.05::numeric, true, '2026 CPF rate, monthly wages above 750'),
    ('2026-01-01'::date, null::date, 'spr_year_3_plus', 0, 55, 750::numeric, null::numeric, 0.17::numeric, 0.20::numeric, true, '2026 CPF rate, monthly wages above 750'),
    ('2026-01-01'::date, null::date, 'spr_year_3_plus', 56, 60, 750::numeric, null::numeric, 0.16::numeric, 0.18::numeric, true, '2026 CPF rate, monthly wages above 750'),
    ('2026-01-01'::date, null::date, 'spr_year_3_plus', 61, 65, 750::numeric, null::numeric, 0.125::numeric, 0.125::numeric, true, '2026 CPF rate, monthly wages above 750'),
    ('2026-01-01'::date, null::date, 'spr_year_3_plus', 66, 70, 750::numeric, null::numeric, 0.09::numeric, 0.075::numeric, true, '2026 CPF rate, monthly wages above 750'),
    ('2026-01-01'::date, null::date, 'spr_year_3_plus', 71, null::integer, 750::numeric, null::numeric, 0.075::numeric, 0.05::numeric, true, '2026 CPF rate, monthly wages above 750')
) as seed_rules (
  effective_from,
  effective_to,
  citizenship_type,
  age_min,
  age_max,
  wage_min,
  wage_max,
  employer_rate,
  employee_rate,
  is_active,
  notes
)
where not exists (
  select 1
  from public.cpf_rate_rules existing
  where existing.effective_from = seed_rules.effective_from
    and existing.citizenship_type = seed_rules.citizenship_type
    and existing.age_min = seed_rules.age_min
    and coalesce(existing.age_max, -1) = coalesce(seed_rules.age_max, -1)
    and existing.wage_min = seed_rules.wage_min
    and coalesce(existing.wage_max, -1) = coalesce(seed_rules.wage_max, -1)
);
