alter table public.employees
add column if not exists work_permit_expiry date,
add column if not exists passport_expiry date,
add column if not exists medical_expiry date,
add column if not exists wsq_expiry date,
add column if not exists first_aid_expiry date;
