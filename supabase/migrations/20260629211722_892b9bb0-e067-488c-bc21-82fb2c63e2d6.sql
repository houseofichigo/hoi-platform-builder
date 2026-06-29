alter table public.governance_flags
  drop constraint if exists governance_flags_rule_source_check;

alter table public.governance_flags
  add constraint governance_flags_rule_source_check
  check (rule_source in ('eu_ai_act', 'gdpr', 'cnil', 'internal_policy'));

alter table public.process_export
  add column if not exists version integer not null default 1,
  add column if not exists export_json jsonb,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz,
  add column if not exists export_type text not null default 'full',
  add column if not exists format text not null default 'json',
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists generated_by uuid references auth.users(id) on delete set null,
  add column if not exists storage_path text;

update public.process_export
set export_json = payload
where export_json is null
  and payload is not null
  and payload <> '{}'::jsonb;

update public.process_export
set payload = export_json
where export_json is not null
  and (payload is null or payload = '{}'::jsonb);

update public.process_export
set created_by = generated_by
where created_by is null
  and generated_by is not null;

update public.process_export
set generated_by = created_by
where generated_by is null
  and created_by is not null;

create index if not exists idx_process_export_workspace_process_created
  on public.process_export(workspace_id, process_id, created_at desc);

drop policy if exists process_export_write on public.process_export;
drop policy if exists process_export_insert on public.process_export;
drop policy if exists process_export_update on public.process_export;

create policy process_export_insert
  on public.process_export
  for insert
  to authenticated
  with check (
    public.has_workspace_role(workspace_id, auth.uid(), array['member', 'admin', 'owner'])
    and coalesce(created_by, generated_by, auth.uid()) = auth.uid()
  );

create policy process_export_update
  on public.process_export
  for update
  to authenticated
  using (
    public.has_workspace_role(workspace_id, auth.uid(), array['admin', 'owner'])
    or coalesce(created_by, generated_by) = auth.uid()
  )
  with check (
    public.has_workspace_role(workspace_id, auth.uid(), array['admin', 'owner'])
    or coalesce(created_by, generated_by) = auth.uid()
  );