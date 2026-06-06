create table if not exists public.client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'client_viewer' check (role in ('client_viewer', 'client_admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auth_user_id)
);

create index if not exists client_users_client_id_idx
on public.client_users (client_id);

create index if not exists client_users_auth_user_id_idx
on public.client_users (auth_user_id);

create index if not exists client_users_email_idx
on public.client_users (lower(email));

create index if not exists client_users_status_idx
on public.client_users (status);

alter table public.client_users enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'client_users'
      and policyname = 'Client portal users view own mapping'
  ) then
    create policy "Client portal users view own mapping"
    on public.client_users
    for select
    to authenticated
    using (auth.uid() = auth_user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clients'
      and policyname = 'Client portal users view own client'
  ) then
    create policy "Client portal users view own client"
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
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'invoices'
      and policyname = 'Client portal users view own invoices'
  ) then
    create policy "Client portal users view own invoices"
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
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'invoice_items'
      and policyname = 'Client portal users view own invoice items'
  ) then
    create policy "Client portal users view own invoice items"
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
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'quotations'
      and policyname = 'Client portal users view own quotations'
  ) then
    create policy "Client portal users view own quotations"
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
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'quotation_items'
      and policyname = 'Client portal users view own quotation items'
  ) then
    create policy "Client portal users view own quotation items"
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
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'attendance_records'
      and policyname = 'Client portal users view own attendance'
  ) then
    create policy "Client portal users view own attendance"
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
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'checklist_submissions'
      and policyname = 'Client portal users view own checklist submissions'
  ) then
    create policy "Client portal users view own checklist submissions"
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
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'checklist_submission_items'
      and policyname = 'Client portal users view own checklist submission items'
  ) then
    create policy "Client portal users view own checklist submission items"
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
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'checklist_templates'
      and policyname = 'Client portal users view checklist templates'
  ) then
    create policy "Client portal users view checklist templates"
    on public.checklist_templates
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.client_users
        where client_users.auth_user_id = auth.uid()
          and client_users.status = 'active'
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'checklist_items'
      and policyname = 'Client portal users view checklist items'
  ) then
    create policy "Client portal users view checklist items"
    on public.checklist_items
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.client_users
        where client_users.auth_user_id = auth.uid()
          and client_users.status = 'active'
      )
    );
  end if;
end $$;
