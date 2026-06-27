import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Building2, UserPlus } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAssignMemberStructure, useOrgChart } from "@/lib/db/org-chart";
import { sendWorkspaceInvite } from "@/lib/invitations.functions";
import {
  getWorkspaceAdminMembers,
  removeWorkspaceMember,
  revokeWorkspaceInvitation,
  type WorkspaceAdminInvitation,
  type WorkspaceAdminMember,
} from "@/lib/workspace-admin.functions";

export const Route = createFileRoute("/app/$workspaceSlug/admin/members")({
  component: WorkspaceAdminMembersPage,
});

function WorkspaceAdminMembersPage() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();
  const getMembers = useServerFn(getWorkspaceAdminMembers);
  const resendInvite = useServerFn(sendWorkspaceInvite);
  const revokeInvite = useServerFn(revokeWorkspaceInvitation);
  const removeMember = useServerFn(removeWorkspaceMember);
  const { data: orgChart } = useOrgChart();
  const assignStructure = useAssignMemberStructure();
  const { data, isLoading, error } = useQuery({
    enabled: !!workspace,
    queryKey: ["workspace-admin", "members", workspace?.id],
    queryFn: () => getMembers({ data: { workspaceId: workspace!.id } }),
  });

  const refreshMembers = () => {
    if (!workspace) return;
    qc.invalidateQueries({ queryKey: ["workspace-admin", "members", workspace.id] });
    qc.invalidateQueries({ queryKey: ["workspace-admin", "overview", workspace.id] });
    qc.invalidateQueries({ queryKey: ["org-chart", workspace.id] });
  };

  const resendMutation = useMutation({
    mutationFn: (invite: WorkspaceAdminInvitation) => {
      if (!workspace) throw new Error("Workspace not ready");
      if (invite.role !== "member" && invite.role !== "viewer") {
        throw new Error("Ask House of Ichigo to manage owner/admin invitations.");
      }
      return resendInvite({
        data: {
          workspace_id: workspace.id,
          email: invite.email,
          role: invite.role,
          origin: window.location.origin,
        },
      });
    },
    onSuccess: () => {
      toast.success("Invitation resent");
      refreshMembers();
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const peopleByUserId = new Map((orgChart?.people ?? []).map((person) => [person.userId, person]));
  const personOptions = orgChart?.people ?? [];
  const departmentOptions = orgChart?.departments ?? [];

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => {
      if (!workspace) throw new Error("Workspace not ready");
      return revokeInvite({ data: { workspaceId: workspace.id, invitationId: inviteId } });
    },
    onSuccess: () => {
      toast.success("Invitation revoked");
      refreshMembers();
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const removeMutation = useMutation({
    mutationFn: (member: WorkspaceAdminMember) => {
      if (!workspace) throw new Error("Workspace not ready");
      return removeMember({ data: { workspaceId: workspace.id, userId: member.user_id } });
    },
    onSuccess: () => {
      toast.success("Member removed");
      refreshMembers();
    },
    onError: (err) => toast.error((err as Error).message),
  });

  if (!workspace) return null;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-chalk bg-white p-5">
        <div>
          <p className="eyebrow-muted">Team access</p>
          <h2 className="mt-2 text-[22px] font-semibold text-navy">Members and invitations.</h2>
          <p className="mt-2 max-w-[64ch] text-[13px] text-graphite">
            Invite members and viewers, remove workspace access, and assign people into the Company Setup org chart. Owner/admin promotions are handled by House of Ichigo.
          </p>
        </div>
        <Link
          to="/app/$workspaceSlug/invite"
          params={{ workspaceSlug: workspace.slug }}
          className="btn-ichigo btn-ichigo-primary text-[13px]"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite people
        </Link>
      </section>

      {isLoading ? (
        <p className="text-[13px] text-slate">Loading members...</p>
      ) : error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          {(error as Error).message}
        </p>
      ) : data ? (
        <>
          <section className="overflow-hidden rounded-md border border-chalk bg-white">
            <div className="border-b border-chalk px-4 py-3">
              <p className="eyebrow-muted">Current members</p>
            </div>
            <table className="w-full text-[13px]">
              <thead className="bg-mist text-left font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
                <tr>
                  <th className="px-4 py-3 font-normal">User</th>
                  <th className="px-4 py-3 font-normal">Role</th>
                  <th className="px-4 py-3 font-normal">Profile</th>
                  <th className="px-4 py-3 font-normal">Onboarding</th>
                  <th className="px-4 py-3 font-normal">Joined</th>
                  <th className="px-4 py-3 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((member) => (
                  <tr key={member.user_id} className="border-t border-chalk text-navy">
                    <td className="px-4 py-3">
                      <p className="font-medium">{member.full_name || member.email || "Unnamed member"}</p>
                      <p className="text-[12px] text-slate">{member.email || member.user_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] capitalize text-slate">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {[member.job_role, member.department].filter(Boolean).join(" · ") || "Not set"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <StatusPill tone={member.profileComplete ? "ok" : "warn"}>
                          {member.profileComplete ? "Profile set" : "Profile missing"}
                        </StatusPill>
                        <StatusPill tone={member.assessCompleted > 0 ? "ok" : "neutral"}>
                          {member.assessCompleted}/{member.assessTotal} Assess
                        </StatusPill>
                      </div>
                      <p className="mt-1 text-[11px] text-slate">
                        {member.lastActivityAt ? `Last active ${new Date(member.lastActivityAt).toLocaleDateString()}` : "No activity yet"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate">{new Date(member.joined_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {member.role === "member" || member.role === "viewer" ? (
                        <button
                          type="button"
                          disabled={removeMutation.isPending}
                          onClick={() => {
                            if (confirm(`Remove ${member.full_name || member.email || "this member"} from the workspace?`)) {
                              removeMutation.mutate(member);
                            }
                          }}
                          className="text-[12px] text-danger hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="text-[12px] text-slate">HOI managed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-md border border-chalk bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-terracotta" />
                  <p className="eyebrow-muted">Org chart alignment</p>
                </div>
                <p className="mt-2 max-w-[64ch] text-[13px] text-graphite">
                  Department and manager assignments are shared with Company Setup, Build ownership, and process review context.
                </p>
              </div>
              <Link
                to="/app/$workspaceSlug/admin/onboarding"
                params={{ workspaceSlug: workspace.slug }}
                className="btn-ichigo btn-ichigo-outline text-[13px]"
              >
                Open Company Setup
              </Link>
            </div>

            <div className="mt-5 overflow-hidden rounded-md border border-chalk">
              <table className="w-full text-[13px]">
                <thead className="bg-mist text-left font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
                  <tr>
                    <th className="px-4 py-3 font-normal">Person</th>
                    <th className="px-4 py-3 font-normal">Department</th>
                    <th className="px-4 py-3 font-normal">Manager</th>
                  </tr>
                </thead>
                <tbody>
                  {data.members.map((member) => {
                    const person = peopleByUserId.get(member.user_id);
                    return (
                      <tr key={member.user_id} className="border-t border-chalk text-navy">
                        <td className="px-4 py-3">
                          <p className="font-medium">{member.full_name || member.email || "Unnamed member"}</p>
                          <p className="text-[12px] text-slate">{member.job_role || person?.jobTitle || member.role}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            disabled={!person || assignStructure.isPending}
                            value={person?.departmentId ?? ""}
                            onChange={(event) => {
                              if (!person) return;
                              assignStructure.mutate(
                                {
                                  memberId: person.id,
                                  departmentId: event.target.value || null,
                                  managerMemberId: person.managerMemberId,
                                },
                                {
                                  onSuccess: refreshMembers,
                                  onError: (err) => toast.error((err as Error).message),
                                },
                              );
                            }}
                            className="w-full rounded-md border border-chalk bg-white px-3 py-2 text-[13px] text-navy disabled:bg-mist disabled:text-slate"
                          >
                            <option value="">Unassigned</option>
                            {departmentOptions.map((department) => (
                              <option key={department.id} value={department.id}>
                                {department.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            disabled={!person || assignStructure.isPending}
                            value={person?.managerMemberId ?? ""}
                            onChange={(event) => {
                              if (!person) return;
                              assignStructure.mutate(
                                {
                                  memberId: person.id,
                                  departmentId: person.departmentId,
                                  managerMemberId: event.target.value || null,
                                },
                                {
                                  onSuccess: refreshMembers,
                                  onError: (err) => toast.error((err as Error).message),
                                },
                              );
                            }}
                            className="w-full rounded-md border border-chalk bg-white px-3 py-2 text-[13px] text-navy disabled:bg-mist disabled:text-slate"
                          >
                            <option value="">No manager</option>
                            {personOptions
                              .filter((candidate) => candidate.id !== person?.id)
                              .map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.displayName}
                                </option>
                              ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-chalk bg-white">
            <div className="border-b border-chalk px-4 py-3">
              <p className="eyebrow-muted">Pending invitations</p>
            </div>
            {data.pendingInvitations.length === 0 ? (
              <p className="p-6 text-[13px] text-slate">No pending invitations.</p>
            ) : (
              <table className="w-full text-[13px]">
                <thead className="bg-mist text-left font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
                  <tr>
                    <th className="px-4 py-3 font-normal">Email</th>
                    <th className="px-4 py-3 font-normal">Role</th>
                    <th className="px-4 py-3 font-normal">Sent</th>
                    <th className="px-4 py-3 font-normal">Expires</th>
                    <th className="px-4 py-3 text-right font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pendingInvitations.map((invite) => (
                    <tr key={invite.id} className="border-t border-chalk text-navy">
                      <td className="px-4 py-3">{invite.email}</td>
                      <td className="px-4 py-3 capitalize">{invite.role}</td>
                      <td className="px-4 py-3 text-slate">{new Date(invite.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate">{new Date(invite.expires_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {(invite.role === "member" || invite.role === "viewer") && (
                          <button
                            type="button"
                            disabled={resendMutation.isPending}
                            onClick={() => resendMutation.mutate(invite)}
                            className="mr-3 text-[12px] text-azure hover:underline disabled:opacity-50"
                          >
                            Resend
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={revokeMutation.isPending}
                          onClick={() => {
                            if (confirm(`Revoke invitation for ${invite.email}?`)) revokeMutation.mutate(invite.id);
                          }}
                          className="text-[12px] text-danger hover:underline disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function StatusPill({ children, tone }: { children: ReactNode; tone: "ok" | "warn" | "neutral" }) {
  const toneClass =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warn"
        ? "bg-amber-50 text-amber-700"
        : "bg-mist text-slate";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] ${toneClass}`}>{children}</span>;
}
