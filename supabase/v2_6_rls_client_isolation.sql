-- V2.6 RLS hardening for Customer Portal client-level isolation.
-- Internal operations users are authenticated users who do not have an active client_users mapping.
-- Customer portal users can only read records linked to their mapped client_id.

alter table public.clients enable row level security;
alter table public.attendance_records enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_items enable row level security;
alter table public.checklist_submissions enable row level security;
alter table public.checklist_submission_items enable row level security;

drop policy if exists "Authenticated users manage clients" on public.clients;
drop policy if exists "Client portal users view own client" on public.clients;
drop policy if exists "Internal users manage clients" on public.clients;
drop policy if exists "Client users view mapped client" on public.clients;

drop policy if exists "Authenticated users manage attendance records" on public.attendance_records;
drop policy if exists "Client portal users view own attendance" on public.attendance_records;
drop policy if exists "Internal users manage attendance records" on public.attendance_records;
drop policy if exists "Client users view mapped attendance records" on public.attendance_records;

drop policy if exists "Authenticated users manage quotations" on public.quotations;
drop policy if exists "Client portal users view own quotations" on public.quotations;
drop policy if exists "Internal users manage quotations" on public.quotations;
drop policy if exists "Client users view mapped quotations" on public.quotations;

drop policy if exists "Authenticated users manage quotation items" on public.quotation_items;
drop policy if exists "Client portal users view own quotation items" on public.quotation_items;
drop policy if exists "Internal users manage quotation items" on public.quotation_items;
drop policy if exists "Client users view mapped quotation items" on public.quotation_items;

drop policy if exists "Authenticated users manage invoices" on public.invoices;
drop policy if exists "Client portal users view own invoices" on public.invoices;
drop policy if exists "Internal users manage invoices" on public.invoices;
drop policy if exists "Client users view mapped invoices" on public.invoices;

drop policy if exists "Authenticated users manage invoice items" on public.invoice_items;
drop policy if exists "Client portal users view own invoice items" on public.invoice_items;
drop policy if exists "Internal users manage invoice items" on public.invoice_items;
drop policy if exists "Client users view mapped invoice items" on public.invoice_items;

drop policy if exists "Authenticated users manage checklist templates" on public.checklist_templates;
drop policy if exists "Client portal users view checklist templates" on public.checklist_templates;
drop policy if exists "Internal users manage checklist templates" on public.checklist_templates;
drop policy if exists "Client users view submitted checklist templates" on public.checklist_templates;

drop policy if exists "Authenticated users manage checklist items" on public.checklist_items;
drop policy if exists "Client portal users view checklist items" on public.checklist_items;
drop policy if exists "Internal users manage checklist items" on public.checklist_items;
drop policy if exists "Client users view submitted checklist items" on public.checklist_items;

drop policy if exists "Authenticated users manage checklist submissions" on public.checklist_submissions;
drop policy if exists "Client portal users view own checklist submissions" on public.checklist_submissions;
drop policy if exists "Internal users manage checklist submissions" on public.checklist_submissions;
drop policy if exists "Client users view mapped checklist submissions" on public.checklist_submissions;

drop policy if exists "Authenticated users manage checklist submission items" on public.checklist_submission_items;
drop policy if exists "Client portal users view own checklist submission items" on public.checklist_submission_items;
drop policy if exists "Internal users manage checklist submission items" on public.checklist_submission_items;
drop policy if exists "Client users view mapped checklist submission items" on public.checklist_submission_items;

create policy "Internal users manage clients"
on public.clients
for all
to authenticated
using (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
)
with check (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Client users view mapped client"
on public.clients
for select
to authenticated
using (
  exists (
    select 1
    from public.client_users
    where client_users.client_id = clients.id
      and client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Internal users manage attendance records"
on public.attendance_records
for all
to authenticated
using (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
)
with check (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Client users view mapped attendance records"
on public.attendance_records
for select
to authenticated
using (
  exists (
    select 1
    from public.client_users
    where client_users.client_id = attendance_records.client_id
      and client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Internal users manage quotations"
on public.quotations
for all
to authenticated
using (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
)
with check (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Client users view mapped quotations"
on public.quotations
for select
to authenticated
using (
  exists (
    select 1
    from public.client_users
    where client_users.client_id = quotations.client_id
      and client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Internal users manage quotation items"
on public.quotation_items
for all
to authenticated
using (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
)
with check (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Client users view mapped quotation items"
on public.quotation_items
for select
to authenticated
using (
  exists (
    select 1
    from public.quotations
    join public.client_users on client_users.client_id = quotations.client_id
    where quotations.id = quotation_items.quotation_id
      and client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Internal users manage invoices"
on public.invoices
for all
to authenticated
using (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
)
with check (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Client users view mapped invoices"
on public.invoices
for select
to authenticated
using (
  exists (
    select 1
    from public.client_users
    where client_users.client_id = invoices.client_id
      and client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Internal users manage invoice items"
on public.invoice_items
for all
to authenticated
using (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
)
with check (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Client users view mapped invoice items"
on public.invoice_items
for select
to authenticated
using (
  exists (
    select 1
    from public.invoices
    join public.client_users on client_users.client_id = invoices.client_id
    where invoices.id = invoice_items.invoice_id
      and client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Internal users manage checklist templates"
on public.checklist_templates
for all
to authenticated
using (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
)
with check (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Client users view submitted checklist templates"
on public.checklist_templates
for select
to authenticated
using (
  exists (
    select 1
    from public.checklist_submissions
    join public.client_users on client_users.client_id = checklist_submissions.client_id
    where checklist_submissions.template_id = checklist_templates.id
      and client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Internal users manage checklist items"
on public.checklist_items
for all
to authenticated
using (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
)
with check (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Client users view submitted checklist items"
on public.checklist_items
for select
to authenticated
using (
  exists (
    select 1
    from public.checklist_submission_items
    join public.checklist_submissions on checklist_submissions.id = checklist_submission_items.submission_id
    join public.client_users on client_users.client_id = checklist_submissions.client_id
    where checklist_submission_items.checklist_item_id = checklist_items.id
      and client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Internal users manage checklist submissions"
on public.checklist_submissions
for all
to authenticated
using (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
)
with check (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Client users view mapped checklist submissions"
on public.checklist_submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.client_users
    where client_users.client_id = checklist_submissions.client_id
      and client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Internal users manage checklist submission items"
on public.checklist_submission_items
for all
to authenticated
using (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
)
with check (
  not exists (
    select 1
    from public.client_users
    where client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);

create policy "Client users view mapped checklist submission items"
on public.checklist_submission_items
for select
to authenticated
using (
  exists (
    select 1
    from public.checklist_submissions
    join public.client_users on client_users.client_id = checklist_submissions.client_id
    where checklist_submissions.id = checklist_submission_items.submission_id
      and client_users.auth_user_id = auth.uid()
      and client_users.status = 'active'
  )
);
