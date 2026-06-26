-- Final deploy-readiness RLS tightening.
-- Keep workspace data visible only to the owning user, shared workspace members,
-- workspace admins, or House of Ichigo admins as appropriate.

alter table public.profiles enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.workspace_subscriptions enable row level security;
alter table public.billing_events enable row level security;

drop policy if exists "Authenticated users can view any profile" on public.profiles;
drop policy if exists "Users can view own and workspace profiles" on public.profiles;

create policy "Users can view own and workspace profiles"
on public.profiles for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_hoi_admin(auth.uid())
  or exists (
    select 1
    from public.workspace_members viewer_membership
    join public.workspace_members profile_membership
      on profile_membership.workspace_id = viewer_membership.workspace_id
    where viewer_membership.user_id = auth.uid()
      and profile_membership.user_id = public.profiles.user_id
  )
);

drop policy if exists "Members can view workspace invitations" on public.workspace_invitations;
drop policy if exists "Workspace admins and invitees can view invitations" on public.workspace_invitations;

create policy "Workspace admins and invitees can view invitations"
on public.workspace_invitations for select
to authenticated
using (
  public.has_workspace_role(workspace_id, auth.uid(), array['owner','admin'])
  or public.is_hoi_admin(auth.uid())
  or lower(email) = lower(coalesce((select email from auth.users where id = auth.uid()), ''))
);

drop policy if exists "Workspace admins can read workspace subscriptions" on public.workspace_subscriptions;
drop policy if exists "Workspace admins can read billing events" on public.billing_events;

create policy "Workspace admins can read workspace subscriptions"
on public.workspace_subscriptions for select
to authenticated
using (
  public.has_workspace_role(workspace_id, auth.uid(), array['owner','admin'])
);

create policy "Workspace admins can read billing events"
on public.billing_events for select
to authenticated
using (
  public.has_workspace_role(workspace_id, auth.uid(), array['owner','admin'])
);
