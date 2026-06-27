-- Compatibility columns for the workspace-scoped PFS UI.
-- Earlier PFS migrations created some tables before the final Build foundation
-- migration, so this safely ensures the final app-facing column set exists.

alter table public.process
  add column if not exists description text,
  add column if not exists owner_member_id uuid references public.workspace_members(id) on delete set null,
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists trigger text,
  add column if not exists output text,
  add column if not exists frequency text,
  add column if not exists diagram jsonb not null default '{}'::jsonb,
  add column if not exists scores jsonb not null default '{}'::jsonb,
  add column if not exists risk_tier text,
  add column if not exists governance_flags jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.process_step
  add column if not exists step_order integer not null default 0,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists actor_type text,
  add column if not exists actor_member_id uuid references public.workspace_members(id) on delete set null,
  add column if not exists department_id uuid references public.department(id) on delete set null,
  add column if not exists tool_id uuid references public.tool(id) on delete set null,
  add column if not exists tool_name text,
  add column if not exists input_data text,
  add column if not exists output_data text,
  add column if not exists risk_notes text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists node_id text,
  add column if not exists label text,
  add column if not exists kind text,
  add column if not exists actor text,
  add column if not exists automation_level integer,
  add column if not exists hitl text,
  add column if not exists is_checkpoint boolean not null default false,
  add column if not exists assessment jsonb not null default '{}'::jsonb,
  add column if not exists data_source_id uuid references public.data_source(id) on delete set null,
  add column if not exists data_profile jsonb not null default '{}'::jsonb,
  add column if not exists data_quality text,
  add column if not exists is_data_critical boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

update public.process_step
set title = coalesce(title, label, 'Untitled step')
where title is null;

alter table public.tool
  add column if not exists catalog_id uuid references public.tool_catalog(id) on delete set null;

create index if not exists process_owner_member_idx on public.process(owner_member_id) where owner_member_id is not null;
create index if not exists process_step_process_order_idx on public.process_step(process_id, step_order);
create index if not exists tool_catalog_id_idx on public.tool(catalog_id) where catalog_id is not null;

do $$
begin
  if to_regclass('public.process_export') is not null then
    drop policy if exists process_export_creator_insert on public.process_export;
    create policy process_export_creator_insert
    on public.process_export for insert
    to authenticated
    with check (
      created_by = auth.uid()
      and public.has_workspace_role(workspace_id, auth.uid(), array['member','admin','owner'])
    );
  end if;

  if to_regclass('public.vault_reference') is not null then
    drop policy if exists vault_reference_member_process_insert on public.vault_reference;
    create policy vault_reference_member_process_insert
    on public.vault_reference for insert
    to authenticated
    with check (
      entity_type = 'process'
      and public.has_workspace_role(workspace_id, auth.uid(), array['member','admin','owner'])
    );
  end if;
end $$;
