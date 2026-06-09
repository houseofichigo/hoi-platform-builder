import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAssessProgress, useAssessOutput } from "@/hooks/useAssess";
import { supabase } from "@/integrations/supabase/client";
import { Step } from "@/components/assess/Step";
import { PromptBlock } from "@/components/assess/PromptBlock";

const CHAPTER_LABEL = "PHASE 02 · M05 · PROTOTYPING WITH NO-CODE";
const TOTAL_STEPS = 4;
const LOVABLE_PROMPT_COACH_URL =
  "https://chatgpt.com/g/g-694145bd4a848191a12d86d36085daf1-lovable-principal-prompt-engineer";

type StepNum = 1 | 2 | 3 | 4;

interface SurfaceOutput {
  conceptReviewed: boolean;
  sopReviewed: boolean;
  ownUseCaseChosen: boolean;
  promptCoachUsed: boolean;
  sandboxConfirmed: boolean;
  selectedUseCase: string;
}

interface PrototypeBriefOutput {
  websitePrompt: string;
  assistantPrompt: string;
  ownUseCase: string;
}

interface WalkthroughOutput {
  works: string[];
  simulated: string[];
  missing: string[];
}

interface RequirementCard {
  id: string;
  title: string;
  statement: string;
  selected: boolean;
}

interface AgentRequirementsOutput {
  cards: RequirementCard[];
  acknowledged: boolean;
}

const WEBSITE_CRITIQUE_PROMPT = `Act as a senior conversion strategist, UX reviewer, and Lovable prompt architect.

Analyze the attached full-page website screenshot and create a Lovable build prompt that improves the page.

Focus your analysis on:
- Positioning clarity
- Message hierarchy
- Hero section strength
- CTA clarity and placement
- Trust and proof
- Visual flow
- Mobile readability
- Copy clarity
- Friction or confusion
- What the visitor should do next

Your output must be only the final Lovable build prompt.

The Lovable build prompt must include:
- Page goal
- Target audience
- Main positioning improvement
- Sections in order
- Hero direction
- CTA hierarchy
- Trust/proof elements to add or improve
- Visual style direction
- Mobile behavior
- What to avoid

Make the prompt specific enough that Lovable can generate an improved version of the page without needing extra explanation.

Do not include a separate critique section. Do not explain your reasoning. Only output the Lovable build prompt.`;

const ASSISTANT_PROTOTYPE_PROMPT = `Act as a senior product designer and Lovable prompt architect.

Create a Lovable build prompt for an AI assistant prototype.

Use this assistant blueprint:

Purpose: [what the assistant helps users do]
Users: [who will use it]
Inputs: [what users type, upload, or select]
Outputs: [what the assistant returns]
Out of scope: [what the assistant must not answer, promise, or do]

The prototype interface must include:
- A clear assistant name and short description
- Input area for the user request
- Answer or result area
- Citations, evidence, or source references when relevant
- Missing-information or refusal state
- Escalation or next-step action
- Simple history or audit timeline
- Visible sandbox/mock-data label

Sandbox rules:
- Mock data only
- No real PII
- No sensitive files
- No production integrations
- No live payments
- No real emails, CRM writes, HRIS writes, accounting writes, or external system actions

Output only the final Lovable build prompt. Do not explain your reasoning.`;

const CONCEPT_CARDS = [
  {
    title: "Assistant",
    body: "The M04 assistant is the brain. It knows the instructions, sources, refusal rules, and test set.",
  },
  {
    title: "Prototype",
    body: "M05 builds the surface where users click, type, review, approve, escalate, and notice what is missing.",
  },
  {
    title: "Sandbox",
    body: "The prototype uses mock data. No real PII, no production systems, no real money, and no sensitive files.",
  },
  {
    title: "Agent Handoff",
    body: "Every useful fake in the prototype becomes an M06 agent requirement.",
  },
] as const;

const PROTOTYPE_QUESTIONS = ["Value", "Workflow", "Data", "Integrations", "Agent", "Trust"] as const;

const SOP_STEPS = [
  {
    title: "Open a public website",
    body: "Choose a homepage or landing page. Avoid confidential pages, login screens, and internal apps.",
    image: "/images/m05/lovable-sop/sop-image-02-page-01.jpg",
  },
  {
    title: "Capture a full-page screenshot",
    body: "Capture the full page so the AI can see navigation, hero, offer, proof, CTAs, sections, and footer.",
    image: "/images/m05/lovable-sop/step-01.png",
  },
  {
    title: "Open the Lovable Prompt Coach",
    body: "Start a new chat with the Lovable Prompt Coach GPT.",
    image: "/images/m05/lovable-sop/sop-image-03-page-04.jpg",
  },
  {
    title: "Paste the critique/build prompt",
    body: "Paste the prompt from this assignment, then upload the full-page screenshot.",
    image: "/images/m05/lovable-sop/sop-image-07-page-07.jpg",
  },
  {
    title: "Copy the generated Lovable prompt",
    body: "The GPT should output only the final Lovable build prompt. Copy it fully.",
    image: "/images/m05/lovable-sop/sop-image-09-page-08.jpg",
  },
  {
    title: "Paste into Lovable",
    body: "Open Lovable, paste the generated prompt, and start the project build.",
    image: "/images/m05/lovable-sop/sop-image-12-page-10.jpg",
  },
  {
    title: "Generate, review, iterate",
    body: "Review the first version. Iterate with one targeted prompt at a time.",
    image: "/images/m05/lovable-sop/sop-image-15-page-12.jpg",
  },
] as const;

const USE_CASES = [
  {
    title: "RFP Response Assistant",
    body: "Helps teams draft compliant RFP answers from approved company, product, and security material.",
  },
  {
    title: "Proposal Drafting Assistant",
    body: "Turns discovery notes, pricing context, and offer details into a structured proposal draft.",
  },
  {
    title: "Customer Support Policy Assistant",
    body: "Answers policy questions, cites sources, refuses unsupported promises, and escalates edge cases.",
  },
  {
    title: "HR Policy Assistant",
    body: "Explains employee policies with source references and routes sensitive cases to HR.",
  },
  {
    title: "Sales Enablement Assistant",
    body: "Helps reps find positioning, objection handling, approved proof, and follow-up copy.",
  },
  {
    title: "Supplier Onboarding Assistant",
    body: "Guides suppliers through required documents, checks missing items, and explains next steps.",
  },
  {
    title: "SEO Content Assistant",
    body: "Drafts article briefs, outlines, and optimization notes from approved brand and SEO rules.",
  },
  {
    title: "Meeting Follow-up Assistant",
    body: "Turns meeting notes into actions, owners, risks, and follow-up messages.",
  },
  {
    title: "Finance Review Assistant",
    body: "Summarizes finance review packets, flags missing evidence, and prepares approval notes.",
  },
  {
    title: "Internal Knowledge Base Assistant",
    body: "Answers internal questions from approved knowledge entries and identifies missing documentation.",
  },
] as const;

const FINDINGS = {
  works: [
    "The main user path is easy to understand",
    "The assistant purpose is visible",
    "The output area is clear",
    "The next step or escalation path is visible",
    "The prototype is easy to share for feedback",
  ],
  simulated: [
    "Assistant responses are mocked",
    "Citations or evidence are seeded examples",
    "History or audit lives only in the browser",
    "No real integration is connected",
    "No records are written to a production system",
  ],
  missing: [
    "Real retrieval from approved knowledge",
    "User roles or permissions",
    "Persistent audit log",
    "Production monitoring",
    "Human approval workflow",
  ],
} as const;

const DEFAULT_REQUIREMENTS: RequirementCard[] = [
  {
    id: "retrieval_grounding",
    title: "Grounded assistant response",
    statement:
      "The agent must retrieve approved sources before answering. Trigger: user asks a policy or knowledge question. Human approval: no for covered answers, yes for exceptions. Log required: yes.",
    selected: false,
  },
  {
    id: "human_escalation",
    title: "Escalation path",
    statement:
      "The agent must route missing, sensitive, or out-of-scope requests to a human owner. Trigger: no source, unsafe request, or exception. Human approval: yes. Log required: yes.",
    selected: false,
  },
  {
    id: "audit_persistence",
    title: "Audit persistence",
    statement:
      "The agent must persist requests, answers, sources, refusals, and reviewer decisions. Trigger: every assistant interaction. Human approval: no. Log required: yes.",
    selected: false,
  },
  {
    id: "system_sync",
    title: "Safe system sync",
    statement:
      "The agent must prepare approved updates for the system of record without writing directly unless permission is granted. Trigger: human approves an action. Human approval: yes. Log required: yes.",
    selected: false,
  },
] as const satisfies RequirementCard[];

function defaultSurfaces(): SurfaceOutput {
  return {
    conceptReviewed: false,
    sopReviewed: false,
    ownUseCaseChosen: false,
    promptCoachUsed: false,
    sandboxConfirmed: false,
    selectedUseCase: "",
  };
}

function defaultBrief(selectedUseCase = ""): PrototypeBriefOutput {
  return {
    websitePrompt: WEBSITE_CRITIQUE_PROMPT,
    assistantPrompt: ASSISTANT_PROTOTYPE_PROMPT,
    ownUseCase: selectedUseCase,
  };
}

function defaultWalkthrough(): WalkthroughOutput {
  return { works: [], simulated: [], missing: [] };
}

function defaultRequirements(): AgentRequirementsOutput {
  return { cards: DEFAULT_REQUIREMENTS.map((card) => ({ ...card })), acknowledged: false };
}

function selectedCount(cards: RequirementCard[]) {
  return cards.filter((card) => card.selected).length;
}

export function M05Work() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const progress = useAssessProgress("m05");
  const surfacesOut = useAssessOutput<SurfaceOutput>("m05.surfaces");
  const legacyScopeOut = useAssessOutput<Record<string, boolean>>("m05.prototype_scope");
  const briefOut = useAssessOutput<PrototypeBriefOutput>("m05.prototype_brief");
  const walkthroughOut = useAssessOutput<WalkthroughOutput>("m05.walkthrough");
  const requirementsOut = useAssessOutput<AgentRequirementsOutput>("m05.agent_requirements");

  const [step, setStep] = useState<StepNum>(1);
  const [surfaces, setSurfaces] = useState<SurfaceOutput>(defaultSurfaces());
  const [brief, setBrief] = useState<PrototypeBriefOutput>(defaultBrief());
  const [walkthrough, setWalkthrough] = useState<WalkthroughOutput>(defaultWalkthrough());
  const [requirements, setRequirements] = useState<AgentRequirementsOutput>(defaultRequirements());
  const [hydrated, setHydrated] = useState(false);

  const ownAssistantPrompt = useMemo(() => {
    if (!surfaces.selectedUseCase) return ASSISTANT_PROTOTYPE_PROMPT;
    return ASSISTANT_PROTOTYPE_PROMPT.replace(
      "Purpose: [what the assistant helps users do]",
      `Purpose: prototype a ${surfaces.selectedUseCase} interface`,
    );
  }, [surfaces.selectedUseCase]);

  useEffect(() => {
    if (progress.isLoading) return;
    const status = progress.data?.status;
    if (!status || status === "not_started") {
      progress.setStep.mutate(progress.data?.current_step ?? 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.isLoading]);

  useEffect(() => {
    if (
      hydrated ||
      progress.isLoading ||
      surfacesOut.isLoading ||
      legacyScopeOut.isLoading ||
      briefOut.isLoading ||
      walkthroughOut.isLoading ||
      requirementsOut.isLoading
    ) {
      return;
    }

    const nextSurfaces = defaultSurfaces();
    if (surfacesOut.value && typeof surfacesOut.value === "object") {
      const v = surfacesOut.value as Partial<SurfaceOutput>;
      nextSurfaces.conceptReviewed = !!v.conceptReviewed;
      nextSurfaces.sopReviewed = !!v.sopReviewed;
      nextSurfaces.ownUseCaseChosen = !!v.ownUseCaseChosen;
      nextSurfaces.promptCoachUsed = !!v.promptCoachUsed;
      nextSurfaces.sandboxConfirmed = !!v.sandboxConfirmed;
      nextSurfaces.selectedUseCase = typeof v.selectedUseCase === "string" ? v.selectedUseCase : "";
    } else if (legacyScopeOut.value && typeof legacyScopeOut.value === "object") {
      nextSurfaces.conceptReviewed = Object.values(legacyScopeOut.value).some(Boolean);
    }
    setSurfaces(nextSurfaces);

    const nextBrief = defaultBrief(nextSurfaces.selectedUseCase);
    if (briefOut.value && typeof briefOut.value === "object") {
      const v = briefOut.value as Partial<PrototypeBriefOutput> & { brief?: string };
      nextBrief.websitePrompt =
        typeof v.websitePrompt === "string" && v.websitePrompt.length > 0
          ? v.websitePrompt
          : WEBSITE_CRITIQUE_PROMPT;
      nextBrief.assistantPrompt =
        typeof v.assistantPrompt === "string" && v.assistantPrompt.length > 0
          ? v.assistantPrompt
          : typeof v.brief === "string" && v.brief.length > 0
            ? v.brief
            : ASSISTANT_PROTOTYPE_PROMPT;
      nextBrief.ownUseCase =
        typeof v.ownUseCase === "string" && v.ownUseCase.length > 0
          ? v.ownUseCase
          : nextSurfaces.selectedUseCase;
    }
    setBrief(nextBrief);

    const nextWalkthrough = defaultWalkthrough();
    if (walkthroughOut.value && typeof walkthroughOut.value === "object") {
      const v = walkthroughOut.value as Partial<WalkthroughOutput>;
      nextWalkthrough.works = Array.isArray(v.works) ? v.works.filter((x) => typeof x === "string") : [];
      nextWalkthrough.simulated = Array.isArray(v.simulated)
        ? v.simulated.filter((x) => typeof x === "string")
        : [];
      nextWalkthrough.missing = Array.isArray(v.missing)
        ? v.missing.filter((x) => typeof x === "string")
        : [];
    }
    setWalkthrough(nextWalkthrough);

    const nextReqs = defaultRequirements();
    if (requirementsOut.value && typeof requirementsOut.value === "object") {
      const v = requirementsOut.value as Partial<AgentRequirementsOutput> & {
        capabilities?: Record<string, string[]>;
      };
      if (Array.isArray(v.cards)) {
        const byId = new Map(v.cards.map((card) => [card.id, card]));
        nextReqs.cards = nextReqs.cards.map((card) => {
          const saved = byId.get(card.id);
          return saved ? { ...card, selected: !!saved.selected } : card;
        });
      } else if (v.capabilities && typeof v.capabilities === "object") {
        nextReqs.cards = nextReqs.cards.map((card) => ({ ...card, selected: true }));
      }
      nextReqs.acknowledged = !!v.acknowledged;
    }
    setRequirements(nextReqs);

    const current = progress.data?.current_step;
    if (progress.data?.status === "complete") setStep(TOTAL_STEPS);
    else if (current && current >= 1 && current <= TOTAL_STEPS) setStep(current as StepNum);
    setHydrated(true);
  }, [
    hydrated,
    progress.isLoading,
    progress.data?.current_step,
    progress.data?.status,
    surfacesOut.isLoading,
    surfacesOut.value,
    legacyScopeOut.isLoading,
    legacyScopeOut.value,
    briefOut.isLoading,
    briefOut.value,
    walkthroughOut.isLoading,
    walkthroughOut.value,
    requirementsOut.isLoading,
    requirementsOut.value,
  ]);

  const goToStep = async (next: StepNum) => {
    setStep(next);
    await progress.setStep.mutateAsync(next);
  };

  const updateSurfaces = (patch: Partial<SurfaceOutput>) => {
    const next = { ...surfaces, ...patch };
    setSurfaces(next);
    surfacesOut.setValue.mutate(next);
    return next;
  };

  const toggleWalkthrough = (bucket: keyof WalkthroughOutput, value: string) => {
    const current = walkthrough[bucket];
    const nextValues = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    const next = { ...walkthrough, [bucket]: nextValues };
    setWalkthrough(next);
    walkthroughOut.setValue.mutate(next);
  };

  const toggleRequirement = (id: string) => {
    const next = {
      ...requirements,
      cards: requirements.cards.map((card) =>
        card.id === id ? { ...card, selected: !card.selected } : card,
      ),
    };
    setRequirements(next);
    requirementsOut.setValue.mutate(next);
  };

  const completeM05 = async () => {
    if (!user || !workspace) return;
    await surfacesOut.setValue.mutateAsync(surfaces);
    await briefOut.setValue.mutateAsync({ ...brief, assistantPrompt: ownAssistantPrompt });
    await walkthroughOut.setValue.mutateAsync(walkthrough);
    await requirementsOut.setValue.mutateAsync(requirements);

    const { error } = await supabase.from("assess_progress").upsert(
      {
        workspace_id: workspace.id,
        user_id: user.id,
        module_id: "m05",
        status: "complete",
        studied: progress.data?.studied ?? false,
        current_step: null,
        max_step_reached: Math.max(progress.data?.max_step_reached ?? 0, TOTAL_STEPS),
        started_at: progress.data?.started_at ?? new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,user_id,module_id" },
    );
    if (error) {
      toast.error("Could not complete M05. Try again.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["assess-progress", workspace.id, user.id, "m05"] });
    qc.invalidateQueries({ queryKey: ["assess-progress-all", workspace.id, user.id] });
    qc.invalidateQueries({ queryKey: ["resume", workspace.id] });
    qc.invalidateQueries({ queryKey: ["team-status", workspace.id] });
    toast.success("M05 complete. M06 AI Agents & Pilot is unlocked.");
  };

  if (!workspace) return null;

  if (step === 1) {
    return (
      <Step
        storyHeader="M04 built the assistant. M05 builds the surface where users experience it."
        chapterLabel={CHAPTER_LABEL}
        stepLabel="STEP 1 of 4"
        title="Why prototype?"
        why={
          <p>
            A working assistant in a chat window is not yet a product. The prototype reveals what
            users see, edit, approve, escalate, and expect to be logged.
          </p>
        }
        example={
          <p className="text-[14px] text-navy">
            A spec can say "users review the AI output." A prototype shows the fields, status,
            source evidence, approval button, refusal state, and audit trail.
          </p>
        }
        whatToNotice={
          <ul className="list-disc pl-5 text-[14px] text-navy">
            <li>Specs describe intent. Prototypes reveal reality.</li>
            <li>Prototype means sandbox: mock data, no real systems, no sensitive files.</li>
            <li>What the prototype fakes becomes the M06 agent requirement list.</li>
          </ul>
        }
        yourVersion={
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2">
              {CONCEPT_CARDS.map((card) => (
                <InfoCard key={card.title} title={card.title} body={card.body} />
              ))}
            </div>
            <div className="rounded-md border border-chalk bg-white p-4">
              <p className="eyebrow-muted">A GOOD PROTOTYPE ANSWERS</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {PROTOTYPE_QUESTIONS.map((item) => (
                  <div key={item} className="rounded border border-chalk bg-paper px-3 py-2 text-sm text-navy">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <CheckboxRow
              checked={surfaces.conceptReviewed}
              label="I understand that M05 is a sandbox prototype, not production."
              onChange={(checked) => updateSurfaces({ conceptReviewed: checked })}
            />
          </div>
        }
        produces={<p className="text-[14px] text-navy">A clear prototype mindset before using Lovable.</p>}
        canContinue={surfaces.conceptReviewed}
        disabledReason="Confirm the prototype concept before continuing."
        nextLabel="Step 2 - guided Lovable demo"
        onContinue={async () => {
          await surfacesOut.setValue.mutateAsync(surfaces);
          await goToStep(2);
        }}
      />
    );
  }

  if (step === 2) {
    return (
      <Step
        chapterLabel={CHAPTER_LABEL}
        stepLabel="STEP 2 of 4"
        title="Guided demo - upgrade a website with Lovable"
        why={
          <p>
            The website demo teaches the Lovable workflow once: screenshot, prompt, generate,
            review, iterate.
          </p>
        }
        example={
          <p className="text-[14px] text-navy">
            Pick a public homepage or landing page. The goal is to learn the prototyping method,
            not to rebuild a production website.
          </p>
        }
        whatToNotice={
          <ul className="list-disc pl-5 text-[14px] text-navy">
            <li>Use a full-page screenshot so the AI sees the complete page flow.</li>
            <li>The GPT output should be a Lovable build prompt, not a critique report.</li>
            <li>Iterate one change at a time after the first Lovable generation.</li>
          </ul>
        }
        yourVersion={
          <div className="space-y-6">
            <a
              href={LOVABLE_PROMPT_COACH_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-ichigo btn-ichigo-primary inline-flex items-center gap-2"
            >
              Open Lovable Prompt Coach <ExternalLink className="h-4 w-4" />
            </a>
            <PromptBlock label="Copy this prompt into the Lovable Prompt Coach" text={WEBSITE_CRITIQUE_PROMPT} />
            <SopWalkthrough steps={SOP_STEPS} />
            <CheckboxRow
              checked={surfaces.sopReviewed}
              label="I reviewed or followed the website-to-Lovable SOP."
              onChange={(checked) => updateSurfaces({ sopReviewed: checked })}
            />
          </div>
        }
        produces={<p className="text-[14px] text-navy">A repeatable Lovable workflow for fast prototypes.</p>}
        canContinue={surfaces.sopReviewed}
        disabledReason="Review or follow the SOP before continuing."
        nextLabel="Step 3 - build your assistant prototype"
        onBack={() => goToStep(1)}
        onContinue={async () => {
          await briefOut.setValue.mutateAsync(defaultBrief(surfaces.selectedUseCase));
          await surfacesOut.setValue.mutateAsync(surfaces);
          await goToStep(3);
        }}
      />
    );
  }

  if (step === 3) {
    const canContinue =
      surfaces.selectedUseCase.trim().length > 0 && surfaces.ownUseCaseChosen && surfaces.promptCoachUsed;
    return (
      <Step
        chapterLabel={CHAPTER_LABEL}
        stepLabel="STEP 3 of 4"
        title="Build your own assistant prototype"
        why={
          <p>
            Now reuse the same method for an AI assistant interface. Choose a use case, ask the
            Prompt Coach for a Lovable build prompt, paste it into Lovable, and generate.
          </p>
        }
        example={
          <p className="text-[14px] text-navy">
            The prototype can simulate assistant responses. The important thing is the surface:
            input, result, evidence, refusal, escalation, and simple audit.
          </p>
        }
        whatToNotice={
          <ul className="list-disc pl-5 text-[14px] text-navy">
            <li>The interface should make trust visible, not hidden in the prompt.</li>
            <li>Every simulated behavior should be labeled as sandbox or mock.</li>
            <li>Do not connect real systems or use sensitive data in this module.</li>
          </ul>
        }
        yourVersion={
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2">
              {USE_CASES.map((useCase) => {
                const selected = surfaces.selectedUseCase === useCase.title;
                return (
                  <button
                    key={useCase.title}
                    type="button"
                    onClick={() => {
                      const next = updateSurfaces({
                        selectedUseCase: useCase.title,
                        ownUseCaseChosen: true,
                      });
                      setBrief(defaultBrief(next.selectedUseCase));
                    }}
                    className={`rounded-md border p-4 text-left transition ${
                      selected
                        ? "border-terracotta bg-terracotta/10"
                        : "border-chalk bg-white hover:border-slate"
                    }`}
                  >
                    <p className="text-sm font-medium text-navy">{useCase.title}</p>
                    <p className="mt-1 text-[13px] text-slate">{useCase.body}</p>
                  </button>
                );
              })}
            </div>
            {surfaces.selectedUseCase && (
              <div className="rounded-md border border-chalk bg-mist/40 p-4">
                <p className="eyebrow-muted">SELECTED USE CASE</p>
                <p className="mt-1 text-sm font-medium text-navy">{surfaces.selectedUseCase}</p>
              </div>
            )}
            <a
              href={LOVABLE_PROMPT_COACH_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-ichigo btn-ichigo-primary inline-flex items-center gap-2"
            >
              Open Lovable Prompt Coach <ExternalLink className="h-4 w-4" />
            </a>
            <PromptBlock label="Copy this assistant prototype prompt into the Prompt Coach" text={ownAssistantPrompt} />
            <CheckboxRow
              checked={surfaces.promptCoachUsed}
              label="I used or reviewed the Lovable Prompt Coach flow for my assistant prototype."
              onChange={(checked) => updateSurfaces({ promptCoachUsed: checked })}
            />
          </div>
        }
        produces={<p className="text-[14px] text-navy">A Lovable prompt for the learner's own assistant interface.</p>}
        canContinue={canContinue}
        disabledReason="Choose a use case and confirm the Prompt Coach flow."
        nextLabel="Step 4 - test, govern, hand off"
        onBack={() => goToStep(2)}
        onContinue={async () => {
          const nextBrief = {
            websitePrompt: WEBSITE_CRITIQUE_PROMPT,
            assistantPrompt: ownAssistantPrompt,
            ownUseCase: surfaces.selectedUseCase,
          };
          setBrief(nextBrief);
          await briefOut.setValue.mutateAsync(nextBrief);
          await surfacesOut.setValue.mutateAsync(surfaces);
          await goToStep(4);
        }}
      />
    );
  }

  const totalFindings =
    walkthrough.works.length + walkthrough.simulated.length + walkthrough.missing.length;
  const canComplete =
    surfaces.sandboxConfirmed &&
    totalFindings >= 3 &&
    selectedCount(requirements.cards) >= 3 &&
    requirements.acknowledged;

  return (
    <Step
      chapterLabel={CHAPTER_LABEL}
      stepLabel="STEP 4 of 4"
      title="Test, govern, hand off to M06"
      why={
        <p>
          A prototype only helps if it shows what works, what is simulated, and what is missing.
          That evidence becomes the agent build scope in M06.
        </p>
      }
      example={
        <p className="text-[14px] text-navy">
          If the prototype fakes citations, escalation, and audit history, M06 must decide how the
          real agent retrieves, routes, and logs those actions.
        </p>
      }
      whatToNotice={
        <ul className="list-disc pl-5 text-[14px] text-navy">
          <li>Prototype: sandbox. Pilot: controlled. Production: governed.</li>
          <li>Do not treat a polished prototype as a safe production system.</li>
          <li>Pick three bounded, repeated, governed requirements for M06.</li>
        </ul>
      }
      yourVersion={
        <div className="space-y-6">
          <CheckboxRow
            checked={surfaces.sandboxConfirmed}
            label="I confirm this prototype uses mock data only and no production integrations."
            onChange={(checked) => updateSurfaces({ sandboxConfirmed: checked })}
          />
          <FindingsPanel
            title="What works"
            options={FINDINGS.works}
            selected={walkthrough.works}
            onToggle={(value) => toggleWalkthrough("works", value)}
          />
          <FindingsPanel
            title="What is simulated"
            options={FINDINGS.simulated}
            selected={walkthrough.simulated}
            onToggle={(value) => toggleWalkthrough("simulated", value)}
          />
          <FindingsPanel
            title="What is missing"
            options={FINDINGS.missing}
            selected={walkthrough.missing}
            onToggle={(value) => toggleWalkthrough("missing", value)}
          />
          <div className="space-y-3">
            <p className="text-sm font-medium text-navy">Choose three M06 agent requirements.</p>
            {requirements.cards.map((card) => (
              <label
                key={card.id}
                className={`block cursor-pointer rounded-md border p-4 transition ${
                  card.selected ? "border-terracotta bg-terracotta/10" : "border-chalk bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={card.selected}
                    onChange={() => toggleRequirement(card.id)}
                    className="mt-1 h-4 w-4 accent-terracotta"
                  />
                  <div>
                    <p className="text-sm font-medium text-navy">{card.title}</p>
                    <p className="mt-1 text-[13px] text-slate">{card.statement}</p>
                  </div>
                </div>
              </label>
            ))}
            <p className="font-mono text-[11px] text-slate">
              {selectedCount(requirements.cards)} selected · target 3
            </p>
          </div>
          <CheckboxRow
            checked={requirements.acknowledged}
            label="These three requirement cards are the handoff I will bring to M06."
            onChange={(checked) => {
              const next = { ...requirements, acknowledged: checked };
              setRequirements(next);
              requirementsOut.setValue.mutate(next);
            }}
          />
        </div>
      }
      produces={<p className="text-[14px] text-navy">A sandboxed prototype review and M06 handoff.</p>}
      canContinue={canComplete}
      disabledReason="Confirm sandbox rules, select at least 3 findings, choose 3 requirements, and confirm."
      nextLabel="Complete M05 → unlock M06"
      onBack={() => goToStep(3)}
      onContinue={completeM05}
    />
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-chalk bg-white p-4">
      <p className="text-sm font-medium text-navy">{title}</p>
      <p className="mt-1 text-[13px] text-slate">{body}</p>
    </div>
  );
}

function CheckboxRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-[14px] text-navy">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-terracotta"
      />
      <span>{label}</span>
    </label>
  );
}

function SopWalkthrough({
  steps,
}: {
  steps: readonly { title: string; body: string; image: string }[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-navy">SOP walkthrough</p>
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <article key={step.title} className="overflow-hidden rounded-md border border-chalk bg-white">
            <div className="aspect-video bg-paper">
              <img
                src={step.image}
                alt={step.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="space-y-1 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-terracotta">
                Step {index + 1}
              </p>
              <h3 className="text-sm font-medium text-navy">{step.title}</h3>
              <p className="text-[13px] text-slate">{step.body}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function FindingsPanel({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="rounded-md border border-chalk bg-white p-4">
      <p className="text-sm font-medium text-navy">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3 py-1.5 text-[12px] transition ${
                isSelected
                  ? "border-terracotta bg-terracotta/10 text-navy"
                  : "border-chalk bg-paper text-slate hover:border-slate"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function M05WorkBackLink({ slug }: { slug: string }) {
  return (
    <Link
      to="/app/$workspaceSlug/assess"
      params={{ workspaceSlug: slug }}
      className="text-[12px] font-mono uppercase tracking-[0.18em] text-slate hover:text-navy"
    >
      ← Back to Assess
    </Link>
  );
}
