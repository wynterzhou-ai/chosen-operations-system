do $$
declare
  v_template_id uuid;
  v_has_is_active boolean;
begin
  select id
  into v_template_id
  from public.checklist_templates
  where name = 'Default Office Cleaning Checklist'
  limit 1;

  if v_template_id is null then
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'checklist_templates'
        and column_name = 'is_active'
    )
    into v_has_is_active;

    if v_has_is_active then
      insert into public.checklist_templates (name, description, is_active)
      values (
        'Default Office Cleaning Checklist',
        'Standard checklist for office cleaning operations',
        true
      )
      returning id into v_template_id;
    else
      insert into public.checklist_templates (name, description)
      values (
        'Default Office Cleaning Checklist',
        'Standard checklist for office cleaning operations'
      )
      returning id into v_template_id;
    end if;
  end if;

  insert into public.checklist_items (template_id, item_text, sort_order, is_required)
  select v_template_id, item_text, sort_order, true
  from (
    values
      ('Pantry counter cleaned', 1),
      ('Meeting room tables wiped', 2),
      ('Meeting room chairs arranged', 3),
      ('Glass panels checked', 4),
      ('Phone booth cleaned', 5),
      ('Waste bins cleared', 6),
      ('Carpet/floor vacuumed', 7),
      ('High-touch surfaces disinfected', 8),
      ('Supplies checked', 9),
      ('Issues reported to supervisor', 10)
  ) as seed_items(item_text, sort_order)
  where not exists (
    select 1
    from public.checklist_items existing
    where existing.template_id = v_template_id
      and existing.item_text = seed_items.item_text
  );
end $$;
