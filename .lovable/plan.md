## Goal

1. Replace the single "AI Transformation Foundations" (12 modules) with two courses:
   - **Course 1 — AI Foundations: From LLMs to Agents** (m01–m06)
   - **Course 2 — AI at Scale: Governance, Portfolio & Roadmap** (m07–m12)
2. Strip every mention of "Gate / Gate 1 / Gate 2 / Gate 3" from the curriculum copy, assignments, artifacts, UI, and routes — keep DB tables in place but stop writing/reading them in the UI.

---

## Part A — Two-course split

### Data model (src/lib/curriculum.ts)

- Add `AssessCourseId = 'ai-foundations' | 'ai-at-scale'` and a new `DEFAULT_ASSESS_COURSE_ID` constant kept for back-compat (maps to `ai-foundations`).
- Replace `COURSES` with two `AssessCourseMeta` entries:
  - `ai-foundations`: modules `m01..m06`, duration recomputed (~13h), framing "6 modules · 2 phases · build an assistant + agent", artifacts trimmed to Foundation + System.
  - `ai-at-scale`: modules `m07..m12`, prereq note "Complete AI Foundations first", framing "6 modules · 2 phases · choose stack, score portfolio, ship roadmap", artifacts Operating Plan + Handoff Pack. Locked until Course 1 is complete.
- Update `PHASES` and `ARTIFACTS` to carry a `courseId` so the assess UI can filter by course.
- Add helper `getCourse(id)`, `getCourseForModule(id)`, `isCourseUnlocked(courseId, allProgress)`.

### Routing & navigation

- `src/routes/app.$workspaceSlug.assess.index.tsx`: convert from single-course landing to a **Course Library** with two cards (Foundations / At Scale), showing progress, lock state, and a "Start / Resume" CTA.
- Add `src/routes/app.$workspaceSlug.assess.$courseId.tsx` (course detail: modules list, methodology, artifacts) and update existing module routes to read `courseId` from the module meta (no URL change needed — modules stay at `/assess/$moduleId/...`).
- Update `PhaseNav`, `ModuleTabs`, `OnboardingChecklist`, `useWorkspaceHome`, resume logic in `useAssess.currentResumeModule`, `ProgramCompletionDashboard`, and `CertificationReadiness` to scope progress per course and surface two completion states.
- Homepage / onboarding tour copy: replace "12-module program" with "two 6-module courses".

### Completion / certification

- `assess.complete.tsx` becomes per-course completion. Add a final "Both courses complete" state for overall certification.
- Adjust `lib/assess/completion.ts` to compute per-course completion.

---

## Part B — Remove gates everywhere

### Curriculum content

- In `MODULES`, drop `gateRole` / `gateNumber` from the type and from every module (or keep the fields typed but set `gateRole: null`, `gateNumber: null` everywhere for minimal type churn — preferred).
- Rewrite copy in m02, m04, m06, m09 to remove "Gate 1/2/3", "gate readiness", "informal/formal gate", and gate-based deliverables. Replace with neutral language: "readiness checklist", "pilot-readiness review", "portfolio review".
- Update `assignment`, `outcome`, `deliverable`, `description`, `keySections`, `concepts`, `assignmentAlignment` for m02/m04/m06/m09 accordingly.
- `COURSES[*].gates` field removed; replace with `readinessChecks` describing the readiness reviews without gate vocabulary, or drop entirely.

### UI / routes to delete

- Delete `src/routes/app.$workspaceSlug.assess.$moduleId.gate.tsx`.
- Delete `src/components/assess/Gate.tsx`, `GateCompletionActions.tsx`, `GateDecisionSummary.tsx`.
- Delete `src/lib/assess/gate-options.ts`.
- Remove gate-related sections in `src/lib/assess/content/course1.ts` (`gateReadinessCriteria`, `gate2Criteria`, `gate3Criteria`, gate dossiers) and equivalent fields in `m02/m04/m06/m09` content files; replace gate references with a "Readiness review" section that just confirms the module deliverable is complete.
- `useAssess.tsx`: remove `useAssessGateDecision`, `GateDecisionRow`, and any gate queries.
- Strip gate UI from `M02Work / M04Work / M06Work / M08Work / M09Work / M12Work`, `ModuleCompletionActions`, `CertificationReadiness`, `ProgramCompletionDashboard`, `ModuleTabs`, `OnboardingChecklist`, `TopShell`, `GuidedTour`, `process-template-library`, `process.new`, `useWorkspace`, etc. (the rg sweep above is the master checklist — every `tsx`/`ts` hit is reviewed; non-curriculum mentions like `org-chart/readiness.ts` reword "gate" → "check" where it referred to the training; PFS / process-data / scoring engine references that mean "approval gate" in the build phase are out of scope and left alone unless the user wants those too).
- m04 sample text and `worked-examples/invoice-ocr/m02|m04|m06|m09` rewritten to drop "Gate" language.

### Database

- Keep `assess_gate_decisions` table in place (no migration that drops data); just stop writing to it. We can add a follow-up migration later if the user wants to fully drop it.

### Files to update or remove (grouped)

- **Update**: `src/lib/curriculum.ts`, all `src/lib/assess/content/*.ts`, all `src/components/assess/**`, all `src/components/assess/modules/M0*Work.tsx`, `src/hooks/useAssess.tsx`, `src/hooks/useWorkspaceHome.tsx`, `src/hooks/useOnboardingChecklist.tsx`, `src/components/OnboardingChecklist.tsx`, `src/components/GuidedTour.tsx`, `src/components/PhaseNav.tsx`, `src/components/WorkspaceLayout.tsx`, `src/routes/app.$workspaceSlug.assess.index.tsx`, `src/routes/app.$workspaceSlug.assess.complete.tsx`, `src/routes/app.$workspaceSlug.assess.$moduleId.*.tsx`, `src/routes/app.$workspaceSlug.index.tsx`, `src/routes/index.tsx`, `src/lib/worked-examples/invoice-ocr/m0{2,4,6,9}.ts`, `src/lib/assess/completion.ts`.
- **Create**: `src/routes/app.$workspaceSlug.assess.$courseId.tsx`, helpers for course lookup.
- **Delete**: `src/routes/app.$workspaceSlug.assess.$moduleId.gate.tsx`, `src/components/assess/Gate.tsx`, `GateCompletionActions.tsx`, `GateDecisionSummary.tsx`, `src/lib/assess/gate-options.ts`.

---

## Verification

- `tsgo` (TypeScript strict build) passes.
- `bunx vitest run` for the assess/scoring suites.
- Playwright spot-check: `/app/{slug}/assess` shows two course cards; Course 2 locked until Course 1 complete; opening m04 / m06 / m09 shows no gate tab, no gate copy, no "Record Gate decision" CTA; module completion still gates progression via assignment-complete state.

---

## Open question (one)

Course 2 unlock policy: do you want it **hard-locked** until every Course 1 module is complete, **soft-locked** (visible but warns), or **freely accessible**? Default in this plan is hard-locked.
