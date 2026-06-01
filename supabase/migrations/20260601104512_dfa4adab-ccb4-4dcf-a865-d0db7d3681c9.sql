-- =========================================
-- Tables
-- =========================================

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'free' check (plan in ('free','team','enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members(user_id);
create index workspace_members_workspace_id_idx on public.workspace_members(workspace_id);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  default_workspace_id uuid references public.workspaces(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_workspace_member(_workspace_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = _workspace_id and user_id = _user_id)
$$;

create or replace function public.has_workspace_role(_workspace_id uuid, _user_id uuid, _roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = _workspace_id and user_id = _user_id and role = any(_roles))
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.profiles enable row level security;

create policy "Members can view their workspaces" on public.workspaces for select to authenticated using (public.is_workspace_member(id, auth.uid()));
create policy "Authenticated users can create workspaces" on public.workspaces for insert to authenticated with check (auth.uid() is not null);
create policy "Owners and admins can update workspaces" on public.workspaces for update to authenticated using (public.has_workspace_role(id, auth.uid(), array['owner','admin'])) with check (public.has_workspace_role(id, auth.uid(), array['owner','admin']));
create policy "Owners can delete workspaces" on public.workspaces for delete to authenticated using (public.has_workspace_role(id, auth.uid(), array['owner']));

create policy "Members can view co-members" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "Owners/admins can add members; creator can seat first owner" on public.workspace_members for insert to authenticated
with check (
  public.has_workspace_role(workspace_id, auth.uid(), array['owner','admin'])
  or (user_id = auth.uid() and role = 'owner' and not exists (select 1 from public.workspace_members m where m.workspace_id = workspace_members.workspace_id))
);
create policy "Owners/admins can update members; users can update self" on public.workspace_members for update to authenticated
using (public.has_workspace_role(workspace_id, auth.uid(), array['owner','admin']) or user_id = auth.uid())
with check (public.has_workspace_role(workspace_id, auth.uid(), array['owner','admin']) or user_id = auth.uid());
create policy "Owners/admins can remove members; users can remove themselves" on public.workspace_members for delete to authenticated
using (public.has_workspace_role(workspace_id, auth.uid(), array['owner','admin']) or user_id = auth.uid());

create policy "Authenticated users can view any profile" on public.profiles for select to authenticated using (auth.uid() is not null);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own profile" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own profile" on public.profiles for delete to authenticated using (user_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger workspaces_set_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing; return new; end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

alter table public.workspaces add constraint workspaces_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40);

create or replace function public.create_workspace(p_name text, p_slug text)
returns public.workspaces language plpgsql security definer set search_path = public as $$
declare v_ws public.workspaces; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  insert into public.workspaces (name, slug) values (p_name, p_slug) returning * into v_ws;
  insert into public.workspace_members (workspace_id, user_id, role) values (v_ws.id, v_uid, 'owner');
  update public.profiles set default_workspace_id = v_ws.id where user_id = v_uid;
  return v_ws;
end;
$$;
revoke all on function public.create_workspace(text, text) from public, anon;
grant execute on function public.create_workspace(text, text) to authenticated;

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member', 'viewer')),
  invited_by uuid references auth.users(id) on delete set null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id)
);
create unique index workspace_invitations_pending_unique on public.workspace_invitations (workspace_id, lower(email)) where status = 'pending';
create index workspace_invitations_workspace_idx on public.workspace_invitations(workspace_id);
create index workspace_invitations_token_idx on public.workspace_invitations(token);
alter table public.workspace_invitations enable row level security;

create policy "Members can view workspace invitations" on public.workspace_invitations for select to authenticated using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "Owners/admins can create invitations" on public.workspace_invitations for insert to authenticated with check (public.has_workspace_role(workspace_id, auth.uid(), array['owner','admin']));
create policy "Owners/admins or invited user can update invitations" on public.workspace_invitations for update to authenticated
using (public.has_workspace_role(workspace_id, auth.uid(), array['owner','admin']) or lower(email) = lower(coalesce((select email from auth.users where id = auth.uid()), '')))
with check (public.has_workspace_role(workspace_id, auth.uid(), array['owner','admin']) or lower(email) = lower(coalesce((select email from auth.users where id = auth.uid()), '')));
create policy "Owners/admins can delete invitations" on public.workspace_invitations for delete to authenticated using (public.has_workspace_role(workspace_id, auth.uid(), array['owner','admin']));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications(recipient_user_id, created_at desc);
create index notifications_unread_idx on public.notifications(recipient_user_id) where read_at is null;
alter table public.notifications enable row level security;
create policy "Users can read own notifications" on public.notifications for select to authenticated using (recipient_user_id = auth.uid());
create policy "Users can update own notifications" on public.notifications for update to authenticated using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());
create policy "Users can delete own notifications" on public.notifications for delete to authenticated using (recipient_user_id = auth.uid());

create or replace function public.accept_workspace_invitation(p_token text)
returns public.workspace_members language plpgsql security definer set search_path = public as $$
declare v_invitation public.workspace_invitations; v_member public.workspace_members; v_user_email text;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into v_invitation from public.workspace_invitations where token = p_token and status = 'pending' and expires_at > now();
  if not found then raise exception 'invalid or expired invitation'; end if;
  select email into v_user_email from auth.users where id = auth.uid();
  if lower(v_invitation.email) <> lower(coalesce(v_user_email, '')) then raise exception 'invitation is for a different email'; end if;
  if exists (select 1 from public.workspace_members where workspace_id = v_invitation.workspace_id and user_id = auth.uid()) then
    update public.workspace_invitations set status = 'accepted', accepted_at = now(), accepted_by = auth.uid() where id = v_invitation.id;
    select * into v_member from public.workspace_members where workspace_id = v_invitation.workspace_id and user_id = auth.uid();
    return v_member;
  end if;
  insert into public.workspace_members (workspace_id, user_id, role, invited_by)
    values (v_invitation.workspace_id, auth.uid(), v_invitation.role, v_invitation.invited_by) returning * into v_member;
  update public.workspace_invitations set status = 'accepted', accepted_at = now(), accepted_by = auth.uid() where id = v_invitation.id;
  return v_member;
end;
$$;

create or replace function public.get_invitation_by_token(p_token text)
returns table (workspace_id uuid, workspace_name text, workspace_slug text, email text, role text, status text, expires_at timestamptz, inviter_email text)
language plpgsql security definer set search_path = public as $$
begin
  return query select wi.workspace_id, w.name, w.slug, wi.email, wi.role, wi.status, wi.expires_at, u.email::text
  from public.workspace_invitations wi join public.workspaces w on w.id = wi.workspace_id
  left join auth.users u on u.id = wi.invited_by where wi.token = p_token limit 1;
end;
$$;
grant execute on function public.get_invitation_by_token(text) to anon, authenticated;
grant execute on function public.accept_workspace_invitation(text) to authenticated;

create or replace function public.notify_inviter_on_acceptance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'accepted' and old.status = 'pending' and new.invited_by is not null then
    insert into public.notifications (recipient_user_id, workspace_id, kind, payload)
    values (new.invited_by, new.workspace_id, 'invitation_accepted', jsonb_build_object('accepted_email', new.email, 'accepted_by', new.accepted_by));
  end if;
  return new;
end;
$$;
create trigger workspace_invitation_accepted_notify after update on public.workspace_invitations for each row execute function public.notify_inviter_on_acceptance();

GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(uuid, uuid, text[]) TO authenticated, anon, service_role;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS worked_example text NULL,
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at timestamptz NULL;
ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_worked_example_check
  CHECK (worked_example IS NULL OR worked_example IN ('invoice_ocr','devis_generation','hr_ticket_triage','customer_email','custom'));
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tour_completed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS library_visited_at timestamptz NULL;

CREATE TABLE public.assess_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','complete')),
  studied boolean NOT NULL DEFAULT false,
  current_step integer,
  max_step_reached integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id, module_id)
);
ALTER TABLE public.assess_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own progress; admins read all" ON public.assess_progress FOR SELECT TO authenticated
  USING ((user_id = auth.uid() AND public.is_workspace_member(workspace_id, auth.uid())) OR public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY "Members insert own progress" ON public.assess_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members update own progress" ON public.assess_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members delete own; admins delete any" ON public.assess_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER assess_progress_set_updated_at BEFORE UPDATE ON public.assess_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX assess_progress_workspace_idx ON public.assess_progress(workspace_id);
CREATE INDEX assess_progress_user_idx ON public.assess_progress(workspace_id, user_id);

CREATE TABLE public.assess_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  output_key text NOT NULL,
  value jsonb NOT NULL,
  seeded boolean NOT NULL DEFAULT false,
  touched boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id, output_key)
);
ALTER TABLE public.assess_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own outputs; admins read all" ON public.assess_outputs FOR SELECT TO authenticated
  USING ((user_id = auth.uid() AND public.is_workspace_member(workspace_id, auth.uid())) OR public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY "Members insert own outputs" ON public.assess_outputs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members update own outputs" ON public.assess_outputs FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members delete own; admins delete any outputs" ON public.assess_outputs FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER assess_outputs_set_updated_at BEFORE UPDATE ON public.assess_outputs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX assess_outputs_workspace_user_idx ON public.assess_outputs(workspace_id, user_id);

CREATE TABLE public.assess_gate_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gate_number integer NOT NULL CHECK (gate_number IN (1,2,3)),
  module_id text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('continue','constraints','improve','stop')),
  justification text NOT NULL,
  criteria_responses jsonb NOT NULL,
  constraints jsonb NOT NULL DEFAULT '[]'::jsonb,
  rationales jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id, gate_number)
);
ALTER TABLE public.assess_gate_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own gate decisions; admins read all" ON public.assess_gate_decisions FOR SELECT TO authenticated
  USING ((user_id = auth.uid() AND public.is_workspace_member(workspace_id, auth.uid())) OR public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY "Members insert own gate decisions" ON public.assess_gate_decisions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members update own gate decisions" ON public.assess_gate_decisions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members delete own; admins delete any gate decisions" ON public.assess_gate_decisions FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE INDEX assess_gate_decisions_workspace_user_idx ON public.assess_gate_decisions(workspace_id, user_id);

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS workspace_profile jsonb, ADD COLUMN IF NOT EXISTS use_case_profile jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.profiles where user_id = _user_id and role = 'super_admin')
$$;

create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid null,
  type text not null,
  title text not null,
  summary text,
  module_ids text[] not null default '{}',
  phase_ids text[] not null default '{}',
  tags text[] not null default '{}',
  published boolean not null default false,
  content_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint library_items_type_check check (type in ('prompts','agents','assistants','tools','videos','presentations','documents','case_studies','regulatory','use_case_templates','glossary','research','skills'))
);
create index library_items_type_idx on public.library_items (type);
create index library_items_published_idx on public.library_items (published);
create index library_items_created_at_idx on public.library_items (created_at desc);
create index library_items_module_ids_idx on public.library_items using gin (module_ids);
create index library_items_phase_ids_idx on public.library_items using gin (phase_ids);
create index library_items_tags_idx on public.library_items using gin (tags);
create index library_items_type_pub_created_idx on public.library_items (type, published, created_at desc);
create trigger library_items_set_updated_at before update on public.library_items for each row execute function public.set_updated_at();
alter table public.library_items enable row level security;
create policy "Authenticated users can read published global items" on public.library_items for select to authenticated using (workspace_id is null and published = true);
create policy "Super-admins can read all library items" on public.library_items for select to authenticated using (public.is_super_admin(auth.uid()));
create policy "Super-admins can insert library items" on public.library_items for insert to authenticated with check (public.is_super_admin(auth.uid()));
create policy "Super-admins can update library items" on public.library_items for update to authenticated using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
create policy "Super-admins can delete library items" on public.library_items for delete to authenticated using (public.is_super_admin(auth.uid()));

insert into storage.buckets (id, name, public) values ('library-files', 'library-files', true) on conflict (id) do nothing;
create policy "Public can read library-files" on storage.objects for select to public using (bucket_id = 'library-files');
create policy "Super-admins can upload library-files" on storage.objects for insert to authenticated with check (bucket_id = 'library-files' and public.is_super_admin(auth.uid()));
create policy "Super-admins can update library-files" on storage.objects for update to authenticated using (bucket_id = 'library-files' and public.is_super_admin(auth.uid())) with check (bucket_id = 'library-files' and public.is_super_admin(auth.uid()));
create policy "Super-admins can delete library-files" on storage.objects for delete to authenticated using (bucket_id = 'library-files' and public.is_super_admin(auth.uid()));

-- USE CASES (Build phase)
CREATE TABLE public.use_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  function text,
  description text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT use_cases_function_check CHECK (function IS NULL OR function = ANY (ARRAY['finance','operations','sales','marketing','customer_success','customer_ops','hr','procurement','legal','it','product','other'])),
  CONSTRAINT use_cases_status_check CHECK (status IN ('draft','capturing','scored','submitted','approved','rejected','archived'))
);
CREATE INDEX idx_use_cases_workspace ON public.use_cases(workspace_id);
CREATE INDEX idx_use_cases_created_by ON public.use_cases(created_by);
ALTER TABLE public.use_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view workspace use cases" ON public.use_cases FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members can create use cases in their workspace" ON public.use_cases FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Admins update any use case" ON public.use_cases FOR UPDATE TO authenticated
  USING (has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin'])) WITH CHECK (has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY "Creators update own use case (non-final states)" ON public.use_cases FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid() AND status = ANY (ARRAY['draft','capturing','ready_to_score','scored','submitted','archived']));
CREATE POLICY "Creators or admins can delete use cases" ON public.use_cases FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER trg_use_cases_updated_at BEFORE UPDATE ON public.use_cases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.can_access_use_case(_use_case_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.use_cases uc WHERE uc.id = _use_case_id AND public.is_workspace_member(uc.workspace_id, _user_id))
$$;
CREATE OR REPLACE FUNCTION public.can_modify_use_case(_use_case_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.use_cases uc WHERE uc.id = _use_case_id AND (uc.created_by = _user_id OR public.has_workspace_role(uc.workspace_id, _user_id, ARRAY['owner','admin'])))
$$;
CREATE OR REPLACE FUNCTION public.is_use_case_admin(_use_case_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.use_cases uc WHERE uc.id = _use_case_id AND public.has_workspace_role(uc.workspace_id, _user_id, ARRAY['owner','admin']))
$$;

CREATE TABLE public.use_case_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id uuid NOT NULL REFERENCES public.use_cases(id) ON DELETE CASCADE,
  block_number integer NOT NULL,
  block_title text,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT use_case_captures_block_check CHECK (block_number IN (1,2,3,4)),
  CONSTRAINT use_case_captures_unique UNIQUE (use_case_id, block_number)
);
CREATE INDEX idx_use_case_captures_use_case ON public.use_case_captures(use_case_id);
ALTER TABLE public.use_case_captures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view captures for accessible use cases" ON public.use_case_captures FOR SELECT TO authenticated USING (public.can_access_use_case(use_case_id, auth.uid()));
CREATE POLICY "Modifiers insert captures" ON public.use_case_captures FOR INSERT TO authenticated WITH CHECK (public.can_modify_use_case(use_case_id, auth.uid()));
CREATE POLICY "Modifiers update captures" ON public.use_case_captures FOR UPDATE TO authenticated USING (public.can_modify_use_case(use_case_id, auth.uid())) WITH CHECK (public.can_modify_use_case(use_case_id, auth.uid()));
CREATE POLICY "Modifiers delete captures" ON public.use_case_captures FOR DELETE TO authenticated USING (public.can_modify_use_case(use_case_id, auth.uid()));
CREATE TRIGGER trg_use_case_captures_updated_at BEFORE UPDATE ON public.use_case_captures FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.use_case_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id uuid NOT NULL UNIQUE REFERENCES public.use_cases(id) ON DELETE CASCADE,
  pillar_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_readiness numeric,
  priority numeric,
  quadrant text,
  reason_codes text[] NOT NULL DEFAULT '{}',
  gate_statuses jsonb NOT NULL DEFAULT '{}'::jsonb,
  step_automation_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  scored_at timestamptz,
  scored_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  business_impact numeric,
  feasibility numeric,
  process_maturity numeric,
  risk numeric,
  ai_suitability numeric,
  agent_suitability numeric,
  complexity_score numeric,
  complexity_tag text,
  classification text,
  scoring_version text NOT NULL DEFAULT '2.2',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT use_case_scores_quadrant_check CHECK (quadrant IS NULL OR quadrant IN ('quick-wins','strategic-projects','tactical-improvements','foundational-rebuilds')),
  CONSTRAINT use_case_scores_classification_check CHECK (classification IS NULL OR classification IN ('Automation','AI Assistant','AI Workflow','AI Agent','Not Ready'))
);
ALTER TABLE public.use_case_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view scores for accessible use cases" ON public.use_case_scores FOR SELECT TO authenticated USING (public.can_access_use_case(use_case_id, auth.uid()));
CREATE TRIGGER trg_use_case_scores_updated_at BEFORE UPDATE ON public.use_case_scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.use_case_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id uuid NOT NULL UNIQUE REFERENCES public.use_cases(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  decision text NOT NULL DEFAULT 'pending',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT use_case_approvals_decision_check CHECK (decision IN ('pending','approved','rejected','returned'))
);
ALTER TABLE public.use_case_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view approvals for accessible use cases" ON public.use_case_approvals FOR SELECT TO authenticated USING (public.can_access_use_case(use_case_id, auth.uid()));
CREATE POLICY "Modifiers insert approvals (submit)" ON public.use_case_approvals FOR INSERT TO authenticated WITH CHECK (public.can_modify_use_case(use_case_id, auth.uid()));
CREATE POLICY "Admins update approval decisions" ON public.use_case_approvals FOR UPDATE TO authenticated
  USING (is_use_case_admin(use_case_id, auth.uid())) WITH CHECK (is_use_case_admin(use_case_id, auth.uid()));
CREATE POLICY "Submitter updates own approval (pending only)" ON public.use_case_approvals FOR UPDATE TO authenticated
  USING (can_modify_use_case(use_case_id, auth.uid())) WITH CHECK (can_modify_use_case(use_case_id, auth.uid()) AND decision = 'pending');
CREATE POLICY "Admins delete approvals" ON public.use_case_approvals FOR DELETE TO authenticated USING (public.is_use_case_admin(use_case_id, auth.uid()));
CREATE TRIGGER trg_use_case_approvals_updated_at BEFORE UPDATE ON public.use_case_approvals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCALE
CREATE TABLE public.roadmap_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  use_case_id uuid NOT NULL REFERENCES public.use_cases(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'backlog' CHECK (stage IN ('backlog','pilot','production','scaling','retired')),
  target_quarter text,
  priority_score numeric,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (use_case_id)
);
CREATE INDEX idx_roadmap_entries_ws_stage ON public.roadmap_entries(workspace_id, stage);
CREATE TRIGGER trg_roadmap_entries_updated_at BEFORE UPDATE ON public.roadmap_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.roadmap_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view roadmap entries" ON public.roadmap_entries FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins insert roadmap entries" ON public.roadmap_entries FOR INSERT TO authenticated WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY "Admins update roadmap entries" ON public.roadmap_entries FOR UPDATE TO authenticated USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin'])) WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY "Admins delete roadmap entries" ON public.roadmap_entries FOR DELETE TO authenticated USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));

CREATE TABLE public.roadmap_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  roadmap_entry_id uuid NOT NULL REFERENCES public.roadmap_entries(id) ON DELETE CASCADE,
  use_case_id uuid NOT NULL REFERENCES public.use_cases(id) ON DELETE CASCADE,
  from_stage text CHECK (from_stage IS NULL OR from_stage IN ('backlog','pilot','production','scaling','retired')),
  to_stage text NOT NULL CHECK (to_stage IN ('backlog','pilot','production','scaling','retired')),
  reason text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_roadmap_stage_history_entry ON public.roadmap_stage_history(roadmap_entry_id);
CREATE INDEX idx_roadmap_stage_history_ws ON public.roadmap_stage_history(workspace_id);
ALTER TABLE public.roadmap_stage_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view stage history" ON public.roadmap_stage_history FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins insert stage history" ON public.roadmap_stage_history FOR INSERT TO authenticated WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));

CREATE TABLE public.governance_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  use_case_id uuid NOT NULL REFERENCES public.use_cases(id) ON DELETE CASCADE,
  roadmap_entry_id uuid REFERENCES public.roadmap_entries(id) ON DELETE CASCADE,
  rule_code text NOT NULL,
  rule_source text NOT NULL CHECK (rule_source IN ('eu_ai_act','gdpr','internal_policy')),
  severity text NOT NULL CHECK (severity IN ('hard_stop','requires_action','advisory')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','accepted_risk','not_applicable')),
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (use_case_id, rule_code)
);
CREATE INDEX idx_governance_flags_ws_status ON public.governance_flags(workspace_id, status, severity, rule_source);
CREATE TRIGGER trg_governance_flags_updated_at BEFORE UPDATE ON public.governance_flags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.governance_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view governance flags" ON public.governance_flags FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins insert governance flags" ON public.governance_flags FOR INSERT TO authenticated WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY "Admins update governance flags" ON public.governance_flags FOR UPDATE TO authenticated USING (has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin'])) WITH CHECK (has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY "Admins delete governance flags" ON public.governance_flags FOR DELETE TO authenticated USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_label text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_ws_created ON public.audit_log(workspace_id, created_at DESC);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view audit log" ON public.audit_log FOR SELECT TO authenticated USING (is_workspace_member(workspace_id, auth.uid()));
REVOKE SELECT (before_state, after_state) ON public.audit_log FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_audit_log_with_diffs(p_workspace_id uuid, p_limit int DEFAULT 500)
RETURNS TABLE (id uuid, workspace_id uuid, actor_id uuid, action_type text, entity_type text, entity_id uuid, entity_label text, metadata jsonb, before_state jsonb, after_state jsonb, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_workspace_role(p_workspace_id, auth.uid(), ARRAY['owner','admin']) THEN
    RAISE EXCEPTION 'Only workspace admins can read full audit diffs';
  END IF;
  RETURN QUERY SELECT a.id, a.workspace_id, a.actor_id, a.action_type, a.entity_type, a.entity_id, a.entity_label, a.metadata, a.before_state, a.after_state, a.created_at
    FROM public.audit_log a WHERE a.workspace_id = p_workspace_id ORDER BY a.created_at DESC LIMIT GREATEST(LEAST(p_limit, 2000), 1);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_audit_log_with_diffs(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_audit_log_with_diffs(uuid, int) TO authenticated;

CREATE TABLE public.post_pilot_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  use_case_id uuid NOT NULL REFERENCES public.use_cases(id) ON DELETE CASCADE,
  roadmap_entry_id uuid REFERENCES public.roadmap_entries(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accuracy_score numeric,
  time_saved_hours_per_week numeric,
  error_rate_percent numeric,
  reviewer_load text CHECK (reviewer_load IS NULL OR reviewer_load IN ('reduced','unchanged','increased')),
  user_satisfaction text CHECK (user_satisfaction IS NULL OR user_satisfaction IN ('positive','neutral','negative')),
  recommendation text CHECK (recommendation IS NULL OR recommendation IN ('promote_to_production','extend_pilot','redesign','retire')),
  evidence_notes text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_pilot_reviews_ws_uc ON public.post_pilot_reviews(workspace_id, use_case_id);
ALTER TABLE public.post_pilot_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view post pilot reviews" ON public.post_pilot_reviews FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members submit post pilot reviews" ON public.post_pilot_reviews FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND public.can_access_use_case(use_case_id, auth.uid()) AND submitted_by = auth.uid());
CREATE POLICY "Submitter or admin updates post pilot reviews" ON public.post_pilot_reviews FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid() OR public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (submitted_by = auth.uid() OR public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY "Admins delete post pilot reviews" ON public.post_pilot_reviews FOR DELETE TO authenticated USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));

CREATE OR REPLACE FUNCTION public.add_use_case_to_roadmap_on_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_entry public.roadmap_entries; v_priority numeric; v_actor uuid := auth.uid();
BEGIN
  IF NEW.status <> 'approved' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN RETURN NEW; END IF;
  SELECT priority INTO v_priority FROM public.use_case_scores WHERE use_case_id = NEW.id ORDER BY updated_at DESC LIMIT 1;
  INSERT INTO public.roadmap_entries (workspace_id, use_case_id, owner_id, stage, priority_score, created_by)
    VALUES (NEW.workspace_id, NEW.id, NEW.created_by, 'backlog', v_priority, v_actor)
    ON CONFLICT (use_case_id) DO NOTHING RETURNING * INTO v_entry;
  IF v_entry.id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.roadmap_stage_history (workspace_id, roadmap_entry_id, use_case_id, from_stage, to_stage, reason, changed_by)
    VALUES (NEW.workspace_id, v_entry.id, NEW.id, NULL, 'backlog', 'Approved in Build and added to Scale roadmap', v_actor);
  INSERT INTO public.audit_log (workspace_id, actor_id, action_type, entity_type, entity_id, entity_label, after_state, metadata)
    VALUES (NEW.workspace_id, v_actor, 'roadmap_added', 'roadmap_entry', v_entry.id, NEW.name, to_jsonb(v_entry), jsonb_build_object('use_case_id', NEW.id, 'source', 'build_approval'));
  IF NEW.created_by IS NOT NULL AND NEW.created_by <> COALESCE(v_actor, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    INSERT INTO public.notifications (recipient_user_id, workspace_id, kind, payload)
      VALUES (NEW.created_by, NEW.workspace_id, 'roadmap_added', jsonb_build_object('use_case_id', NEW.id, 'use_case_name', NEW.name, 'roadmap_entry_id', v_entry.id));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_use_case_approval_roadmap AFTER INSERT OR UPDATE OF status ON public.use_cases FOR EACH ROW EXECUTE FUNCTION public.add_use_case_to_roadmap_on_approval();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_role text, ADD COLUMN IF NOT EXISTS department text;

CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  email_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notification preferences" ON public.notification_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own notification preferences" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own notification preferences" ON public.notification_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own notification preferences" ON public.notification_preferences FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_notification_preferences_user ON public.notification_preferences(user_id);

-- v2.2 use_cases extra fields
ALTER TABLE public.use_cases
  ADD COLUMN IF NOT EXISTS use_case_family text,
  ADD COLUMN IF NOT EXISTS lifecycle_state text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS post_commit_edits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capture_version text NOT NULL DEFAULT '2.2',
  ADD COLUMN IF NOT EXISTS capture_v2 jsonb,
  ADD COLUMN IF NOT EXISTS derived_scores jsonb,
  ADD COLUMN IF NOT EXISTS lifecycle_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.use_cases ADD CONSTRAINT use_cases_use_case_family_check
  CHECK (use_case_family IS NULL OR use_case_family IN ('internal_ops','service_delivery','decision_support','compliance_control','data_enablement'));
ALTER TABLE public.use_cases ADD CONSTRAINT use_cases_lifecycle_state_check
  CHECK (lifecycle_state IN ('draft','submitted','reviewed','committed'));

-- Library seed content
INSERT INTO public.library_items (id, workspace_id, type, title, summary, module_ids, phase_ids, tags, published, content_url, metadata, version) VALUES
('11111111-0000-4000-8000-000000000001', NULL, 'prompts', 'Six-Element Prompt for Invoice Review', 'A beginner-friendly prompt template for asking an AI assistant to review invoice data.', ARRAY['m03']::text[], ARRAY['discover','assess']::text[], ARRAY['prompting','invoice-ocr','six-element','beginner']::text[], true, NULL, '{"framework":"six-element","difficulty":"beginner"}'::jsonb, 1),
('11111111-0000-4000-8000-000000000002', NULL, 'agents', 'Invoice Exception Routing Agent', 'A starter architecture for an agent that routes invoice exceptions to the right human reviewer.', ARRAY['m06','m09','m11']::text[], ARRAY['build','scale']::text[], ARRAY['agents','human-in-the-loop','invoice-ocr']::text[], true, NULL, '{"platform":"n8n / Make / custom workflow"}'::jsonb, 1),
('11111111-0000-4000-8000-000000000003', NULL, 'assistants', 'Finance Policy Q&A Assistant', 'An assistant concept for answering questions from finance policies.', ARRAY['m04']::text[], ARRAY['build']::text[], ARRAY['assistants','knowledge-base','finance','rag']::text[], true, NULL, '{"knowledge_base_type":"policy documents and SOPs"}'::jsonb, 1),
('11111111-0000-4000-8000-000000000004', NULL, 'tools', 'OCR Tool Evaluation Checklist', 'A lightweight tool card for comparing OCR providers.', ARRAY['m07','m08']::text[], ARRAY['assess','build']::text[], ARRAY['tools','ocr','governance']::text[], true, NULL, '{"pricing_tier":"usage-based"}'::jsonb, 1),
('11111111-0000-4000-8000-000000000005', NULL, 'videos', 'What Tokens Mean for AI Cost', 'A short starter lesson explaining how tokens affect AI context size and cost.', ARRAY['m01']::text[], ARRAY['discover']::text[], ARRAY['tokens','cost','ai-basics','beginner']::text[], true, NULL, '{"duration_seconds":300}'::jsonb, 1),
('11111111-0000-4000-8000-000000000006', NULL, 'presentations', 'AI Builder Orientation Deck', 'A starter deck outline for the Discover, Assess, Build, and Scale journey.', ARRAY['m01']::text[], ARRAY['discover']::text[], ARRAY['orientation','deck','program-overview']::text[], true, NULL, '{"slide_count":12,"format":"pptx"}'::jsonb, 1),
('11111111-0000-4000-8000-000000000007', NULL, 'documents', 'AI Use Case Intake Template', 'A starter document for capturing a use case.', ARRAY['m01','m02']::text[], ARRAY['discover','assess']::text[], ARRAY['template','use-case','intake']::text[], true, NULL, '{"document_type":"template","page_count":3}'::jsonb, 1),
('11111111-0000-4000-8000-000000000008', NULL, 'case_studies', 'Finance Team Reduces Invoice Review Backlog', 'A sample case study showing how AI can reduce manual invoice triage.', ARRAY['m01','m06','m09']::text[], ARRAY['discover','assess']::text[], ARRAY['case-study','finance','invoice-ocr']::text[], true, NULL, '{"function":"finance","industry":"professional services"}'::jsonb, 1),
('11111111-0000-4000-8000-000000000009', NULL, 'regulatory', 'Human Oversight Starter Note', 'A plain-language note on why high-impact AI workflows need human review.', ARRAY['m04','m06','m11']::text[], ARRAY['assess','scale']::text[], ARRAY['governance','human-oversight','audit']::text[], true, NULL, '{"jurisdiction":"general","framework":"nist"}'::jsonb, 1),
('11111111-0000-4000-8000-000000000010', NULL, 'use_case_templates', 'Invoice OCR and Exception Routing', 'A starter template for evaluating invoice OCR as an AI use case.', ARRAY['m01','m02','m09']::text[], ARRAY['discover','assess']::text[], ARRAY['use-case-template','invoice-ocr','finance']::text[], true, NULL, '{"industry":"cross-industry","function":"finance"}'::jsonb, 1),
('11111111-0000-4000-8000-000000000011', NULL, 'glossary', 'Token', 'A beginner-friendly definition of tokens in AI systems.', ARRAY['m01','m03']::text[], ARRAY['discover']::text[], ARRAY['glossary','tokens','ai-basics']::text[], true, NULL, '{"term":"Token"}'::jsonb, 1),
('11111111-0000-4000-8000-000000000012', NULL, 'research', 'Retrieval-Augmented Generation Overview', 'A starter research note on retrieval.', ARRAY['m04','m08']::text[], ARRAY['discover','build']::text[], ARRAY['research','rag','knowledge-base']::text[], true, NULL, '{"publication_date":"2026-01-01"}'::jsonb, 1),
('11111111-0000-4000-8000-000000000013', NULL, 'skills', 'Prompt Quality Review', 'A starter skill for reviewing prompts.', ARRAY['m03','m10']::text[], ARRAY['assess','build']::text[], ARRAY['skills','prompting','quality']::text[], true, NULL, '{"skill_type":"prompt-review","version":"1.0"}'::jsonb, 1);