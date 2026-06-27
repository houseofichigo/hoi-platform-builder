
do $$
declare
  t text;
  tbls text[] := array[
    'audience','campaign','client','company_profile','company_score','data_source',
    'department','department_score','knowledge_source','member_profile','opportunity',
    'process','process_export','process_status_audit','process_step','process_template',
    'product_service','readiness_assessment','strategic_priority','tool','tool_action',
    'vault','vault_reference','workspace_invitations','workspace_members','roadmap_entries',
    'roadmap_item'
  ];
begin
  foreach t in array tbls loop
    execute format('alter table public.%I alter column organization_id drop not null', t);
  end loop;
end $$;

alter table public.member_profile alter column membership_id drop not null;
