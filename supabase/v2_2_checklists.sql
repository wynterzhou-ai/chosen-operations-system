create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  item_text text not null,
  sort_order integer not null default 0,
  is_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_submissions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete cascade,
  site_name text,
  supervisor_name text,
  submission_date date not null,
  before_photo_url text,
  after_photo_url text,
  remarks text,
  status text not null default 'completed' check (status in ('completed', 'issue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_submission_items (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.checklist_submissions(id) on delete cascade,
  checklist_item_id uuid not null references public.checklist_items(id) on delete restrict,
  result text not null check (result in ('pass', 'fail')),
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists checklist_items_template_id_idx
on public.checklist_items (template_id);

create index if not exists checklist_items_template_sort_idx
on public.checklist_items (template_id, sort_order);

create index if not exists checklist_submissions_template_id_idx
on public.checklist_submissions (template_id);

create index if not exists checklist_submissions_client_id_idx
on public.checklist_submissions (client_id);

create index if not exists checklist_submissions_submission_date_idx
on public.checklist_submissions (submission_date);

create index if not exists checklist_submissions_status_idx
on public.checklist_submissions (status);

create index if not exists checklist_submission_items_submission_id_idx
on public.checklist_submission_items (submission_id);

create index if not exists checklist_submission_items_checklist_item_id_idx
on public.checklist_submission_items (checklist_item_id);

alter table public.checklist_templates enable row level security;
alter table public.checklist_items enable row level security;
alter table public.checklist_submissions enable row level security;
alter table public.checklist_submission_items enable row level security;

create policy "Authenticated users manage checklist templates"
on public.checklist_templates
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users manage checklist items"
on public.checklist_items
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users manage checklist submissions"
on public.checklist_submissions
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users manage checklist submission items"
on public.checklist_submission_items
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('checklist-photos', 'checklist-photos', true)
on conflict (id) do update set public = true;

create policy "Authenticated users upload checklist photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'checklist-photos');

create policy "Public checklist photos are readable"
on storage.objects
for select
to public
using (bucket_id = 'checklist-photos');

create policy "Authenticated users update checklist photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'checklist-photos')
with check (bucket_id = 'checklist-photos');

create policy "Authenticated users delete checklist photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'checklist-photos');
