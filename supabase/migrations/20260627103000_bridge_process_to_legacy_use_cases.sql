-- Bridge approved workspace-scoped Build processes into legacy use_cases so
-- Scale can keep reading use_case* while Build uses process as source of truth.

alter table public.use_cases
  add column if not exists process_id uuid references public.process(id) on delete set null;

create unique index if not exists use_cases_process_id_unique
  on public.use_cases(process_id)
  where process_id is not null;

create index if not exists use_cases_process_id_idx
  on public.use_cases(process_id)
  where process_id is not null;

create or replace function public.process_bridge_numeric(p_value text, p_fallback numeric)
returns numeric
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_value is null or btrim(p_value) = '' then
    return p_fallback;
  end if;
  return p_value::numeric;
exception when invalid_text_representation then
  return p_fallback;
end;
$$;

create or replace function public.mirror_process_to_use_case_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_use_case_id uuid;
  v_function text;
  v_priority numeric;
  v_business_impact numeric;
  v_feasibility numeric;
  v_process_maturity numeric;
  v_risk numeric;
  v_ai_suitability numeric;
  v_agent_suitability numeric;
  v_complexity_score numeric;
  v_quadrant text;
  v_classification text;
  v_reason_codes text[];
begin
  if new.status not in ('approved', 'merged') then
    return new;
  end if;

  v_function := coalesce(nullif(new.capture->>'function', ''), nullif(new.capture->>'department_function', ''), 'other');
  if v_function not in ('finance','sales','hr','customer_ops','procurement','marketing','legal','it','other') then
    v_function := 'other';
  end if;

  insert into public.use_cases (
    workspace_id,
    created_by,
    name,
    function,
    description,
    status,
    capture_v2,
    derived_scores,
    use_case_family,
    lifecycle_state,
    capture_version,
    process_id,
    updated_at
  )
  values (
    new.workspace_id,
    new.created_by,
    new.name,
    v_function,
    new.description,
    'approved',
    jsonb_build_object(
      'source', 'process_bridge',
      'process_id', new.id,
      'department_id', new.department_id,
      'owner_member_id', new.owner_member_id,
      'capture', coalesce(new.capture, '{}'::jsonb)
    ),
    jsonb_build_object(
      'source', 'process_bridge',
      'process_id', new.id,
      'risk_tier', new.risk_tier,
      'scores', coalesce(new.scores, '{}'::jsonb)
    ),
    'internal_ops',
    'committed',
    'process-bridge',
    new.id,
    now()
  )
  on conflict (process_id) where process_id is not null do update
  set
    workspace_id = excluded.workspace_id,
    created_by = excluded.created_by,
    name = excluded.name,
    function = excluded.function,
    description = excluded.description,
    status = 'approved',
    capture_v2 = excluded.capture_v2,
    derived_scores = excluded.derived_scores,
    use_case_family = coalesce(public.use_cases.use_case_family, excluded.use_case_family),
    lifecycle_state = 'committed',
    capture_version = excluded.capture_version,
    updated_at = now()
  returning id into v_use_case_id;

  v_priority := coalesce(
    public.process_bridge_numeric(new.scores->>'priority', null),
    public.process_bridge_numeric(new.scores->>'priorityScore', null),
    public.process_bridge_numeric(new.scores->>'priority_score', null),
    public.process_bridge_numeric(new.scores->>'impact', null),
    50
  );
  v_business_impact := coalesce(public.process_bridge_numeric(new.scores->>'business_impact', null), public.process_bridge_numeric(new.scores->>'impact', null), v_priority);
  v_feasibility := coalesce(public.process_bridge_numeric(new.scores->>'feasibility', null), public.process_bridge_numeric(new.scores->>'readiness', null), 50);
  v_process_maturity := coalesce(public.process_bridge_numeric(new.scores->>'process_maturity', null), public.process_bridge_numeric(new.scores->>'maturity', null), 50);
  v_risk := coalesce(public.process_bridge_numeric(new.scores->>'risk', null), case new.risk_tier when 'critical' then 95 when 'elevated' then 75 when 'standard' then 45 when 'low' then 20 else 50 end);
  v_ai_suitability := coalesce(public.process_bridge_numeric(new.scores->>'ai_suitability', null), public.process_bridge_numeric(new.scores->>'aiReadiness', null), 50);
  v_agent_suitability := coalesce(public.process_bridge_numeric(new.scores->>'agent_suitability', null), public.process_bridge_numeric(new.scores->>'automationValue', null), 50);
  v_complexity_score := coalesce(public.process_bridge_numeric(new.scores->>'complexity_score', null), greatest(0, 100 - v_feasibility));
  v_quadrant := coalesce(nullif(new.scores->>'quadrant', ''), case when v_priority >= 70 and v_feasibility >= 60 then 'quick-wins' when v_priority >= 70 then 'strategic-projects' when v_feasibility >= 60 then 'tactical-improvements' else 'foundational-rebuilds' end);
  if v_quadrant not in ('quick-wins','strategic-projects','tactical-improvements','foundational-rebuilds') then
    v_quadrant := 'strategic-projects';
  end if;
  v_classification := coalesce(nullif(new.scores->>'classification', ''), 'AI Workflow');
  if v_classification not in ('Automation','AI Assistant','AI Workflow','AI Agent','Not Ready') then
    v_classification := 'AI Workflow';
  end if;
  v_reason_codes := case
    when jsonb_typeof(new.scores->'reason_codes') = 'array'
      then array(select jsonb_array_elements_text(new.scores->'reason_codes'))
    else array['PROCESS_BRIDGE']
  end;

  insert into public.use_case_scores (
    use_case_id,
    pillar_scores,
    delivery_readiness,
    priority,
    quadrant,
    reason_codes,
    gate_statuses,
    step_automation_map,
    scored_at,
    scored_by,
    business_impact,
    feasibility,
    process_maturity,
    risk,
    ai_suitability,
    agent_suitability,
    complexity_score,
    complexity_tag,
    classification,
    scoring_version
  )
  values (
    v_use_case_id,
    coalesce(new.scores, '{}'::jsonb),
    v_feasibility,
    v_priority,
    v_quadrant,
    v_reason_codes,
    jsonb_build_object('source', 'process_bridge', 'risk_tier', new.risk_tier),
    coalesce(new.capture->'steps', '[]'::jsonb),
    now(),
    new.created_by,
    v_business_impact,
    v_feasibility,
    v_process_maturity,
    v_risk,
    v_ai_suitability,
    v_agent_suitability,
    v_complexity_score,
    case when v_complexity_score >= 70 then 'high' when v_complexity_score >= 40 then 'medium' else 'low' end,
    v_classification,
    'process-bridge'
  )
  on conflict (use_case_id) do update
  set
    pillar_scores = excluded.pillar_scores,
    delivery_readiness = excluded.delivery_readiness,
    priority = excluded.priority,
    quadrant = excluded.quadrant,
    reason_codes = excluded.reason_codes,
    gate_statuses = excluded.gate_statuses,
    step_automation_map = excluded.step_automation_map,
    scored_at = excluded.scored_at,
    scored_by = excluded.scored_by,
    business_impact = excluded.business_impact,
    feasibility = excluded.feasibility,
    process_maturity = excluded.process_maturity,
    risk = excluded.risk,
    ai_suitability = excluded.ai_suitability,
    agent_suitability = excluded.agent_suitability,
    complexity_score = excluded.complexity_score,
    complexity_tag = excluded.complexity_tag,
    classification = excluded.classification,
    scoring_version = excluded.scoring_version,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_process_approval_use_case_bridge on public.process;
create trigger trg_process_approval_use_case_bridge
after insert or update of status, name, description, department_id, owner_member_id, capture, scores, risk_tier
on public.process
for each row
execute function public.mirror_process_to_use_case_on_approval();

-- Backfill already-approved processes.
update public.process
set status = status,
    updated_at = now()
where status in ('approved', 'merged')
  and archived_at is null;
