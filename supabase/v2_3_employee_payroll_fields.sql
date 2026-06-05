alter table public.employees
add column if not exists basic_salary numeric not null default 0,
add column if not exists hourly_rate numeric not null default 0,
add column if not exists cpf_applicable boolean not null default true,
add column if not exists sdl_applicable boolean not null default true,
add column if not exists bank_name text,
add column if not exists bank_account text,
add column if not exists pwm_grade text;
