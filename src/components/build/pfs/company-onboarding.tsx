import { useState } from "react";
import type { ReactNode } from "react";
import { Building2, Mail, Plus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useInviteWorkspacePerson,
  useOrgChart,
  useSaveDepartment,
  type DepartmentInput,
} from "@/lib/db/org-chart";

export function CompanyOnboarding({ mode = "wizard" }: { mode?: "wizard" | "embedded" }) {
  const orgChart = useOrgChart();
  const saveDepartment = useSaveDepartment();
  const invitePerson = useInviteWorkspacePerson();
  const [department, setDepartment] = useState<DepartmentInput>({ name: "", description: "", headcount: 0 });
  const [inviteEmail, setInviteEmail] = useState("");

  const submitDepartment = async () => {
    if (!department.name.trim()) return;
    await saveDepartment.mutateAsync(department);
    setDepartment({ name: "", description: "", headcount: 0 });
  };

  const submitInvite = async () => {
    if (!inviteEmail.trim()) return;
    await invitePerson.mutateAsync({ email: inviteEmail, role: "member" });
    setInviteEmail("");
  };

  if (orgChart.isLoading) return <p className="text-[13px] text-slate">Loading company setup...</p>;
  if (orgChart.isError) {
    return (
      <Card className="border-red-200 bg-red-50 p-5 text-[13px] text-red-700">
        Company setup did not load: {orgChart.error.message}
      </Card>
    );
  }

  const data = orgChart.data;
  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-3">
        <SetupMetric icon={Building2} label="Departments" value={data?.departments.length ?? 0} />
        <SetupMetric icon={Users} label="Members" value={data?.people.length ?? 0} />
        <SetupMetric icon={Mail} label="Pending invites" value={data?.pendingInvites.length ?? 0} />
      </section>

      <div className={mode === "wizard" ? "grid gap-5 lg:grid-cols-[1.2fr_0.8fr]" : "space-y-5"}>
        <Card className="border-chalk bg-white p-5">
          <p className="eyebrow-muted">Org chart source of truth</p>
          <h2 className="mt-2 text-[22px] font-semibold text-navy">Departments and people</h2>
          <div className="mt-4 space-y-3">
            {(data?.departments ?? []).map((item) => (
              <div key={item.id} className="rounded-md border border-chalk bg-paper p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] font-medium text-navy">{item.name}</p>
                  <span className="text-[12px] text-slate">{item.headcount ?? 0} planned</span>
                </div>
                {item.description ? <p className="mt-1 text-[12px] text-graphite">{item.description}</p> : null}
              </div>
            ))}
            {!data?.departments.length ? <p className="text-[13px] text-slate">Add your first department to start the org chart.</p> : null}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="border-chalk bg-white p-5">
            <p className="eyebrow-muted">Add department</p>
            <div className="mt-4 space-y-3">
              <Field label="Name">
                <Input value={department.name} onChange={(event) => setDepartment((current) => ({ ...current, name: event.target.value }))} />
              </Field>
              <Field label="Description">
                <Textarea
                  value={department.description ?? ""}
                  onChange={(event) => setDepartment((current) => ({ ...current, description: event.target.value }))}
                />
              </Field>
              <Field label="Headcount">
                <Input
                  type="number"
                  min={0}
                  value={department.headcount ?? 0}
                  onChange={(event) => setDepartment((current) => ({ ...current, headcount: Number(event.target.value) }))}
                />
              </Field>
              <Button disabled={saveDepartment.isPending || !department.name.trim()} onClick={submitDepartment} className="w-full bg-terracotta text-white hover:bg-terracotta/90">
                <Plus className="h-4 w-4" />
                Save department
              </Button>
            </div>
          </Card>

          <Card className="border-chalk bg-white p-5">
            <p className="eyebrow-muted">Invite teammate</p>
            <div className="mt-4 space-y-3">
              <Field label="Email">
                <Input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} />
              </Field>
              <Button disabled={invitePerson.isPending || !inviteEmail.trim()} onClick={submitInvite} variant="outline" className="w-full border-chalk">
                <Mail className="h-4 w-4" />
                Stage invite
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SetupMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <Card className="border-chalk bg-white p-4">
      <Icon className="h-4 w-4 text-terracotta" />
      <p className="mt-3 text-[28px] font-semibold leading-none text-navy">{value}</p>
      <p className="mt-1 text-[12px] text-slate">{label}</p>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] text-slate">{label}</Label>
      {children}
    </div>
  );
}
