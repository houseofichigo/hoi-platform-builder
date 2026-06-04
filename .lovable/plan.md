# M02: Consolidate to a single knowledge check on Step 3

## Goal
Today M02 renders a separate quiz on each of the 3 steps. Keep only the Step 3 quiz (the last step) and remove the Step 1 and Step 2 quizzes, so learners do one knowledge check at the end of the module.

## Scope
Frontend-only change inside `src/components/assess/modules/M02Work.tsx`. No schema changes, no changes to other modules, no changes to the Step 3 Guided Build (`M02Step3Guided`) or the blueprint generator.

## Changes

1. **Remove Step 1 and Step 2 quiz UI**
   - Drop the quiz section currently rendered inside the Step 1 and Step 2 `<Step>` content.
   - Remove the quiz from any "can continue" / disabled-reason logic on Steps 1 and 2, so progression depends only on the existing assignment outputs (sources / gaps), not on a quiz.

2. **Keep the Step 3 quiz as the single end-of-module knowledge check**
   - Leave `M02_STEP_QUIZZES.step3` and its rendering on Step 3 intact.
   - Step 3's existing gating (blueprint generated + Gate 1 readiness + quiz pass) remains, so the final quiz still acts as the module's knowledge check.

3. **Trim dead code**
   - Remove `M02_STEP_QUIZZES.step1` and `M02_STEP_QUIZZES.step2` entries.
   - Remove `step1QuizStatus` and `step2QuizStatus` derivations and any references to them.
   - Narrow `M02QuizStepKey` to just `"step3"` and simplify `M02KnowledgeCheckState` / `createDefaultM02KnowledgeCheck` / `normalizeM02KnowledgeCheck` to only track `step3`.
   - Persisted `m02.knowledge_check` output continues to be written; `normalizeM02KnowledgeCheck` will safely ignore any legacy `step1`/`step2` fields from prior saves (backward compatible — no migration needed).

## Out of scope
- No changes to `M01`–`M12` other than M02.
- No changes to assess output keys, completion artifacts, or gate logic.
- No visual redesign of the Step 3 quiz itself.

## Verification
- Step 1 and Step 2 no longer show a "Knowledge check" block; Continue is enabled once their existing assignment inputs are filled.
- Step 3 still shows the knowledge check and still requires passing it (alongside blueprint + Gate 1) to complete M02.
- Reloading a workspace that previously answered Step 1/Step 2 quizzes does not error — legacy fields are ignored.
