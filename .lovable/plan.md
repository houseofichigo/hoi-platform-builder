## Goal

Bring the Step 3 "Parameter Playground" quiz (Q1–Q6) up to the same Check-answers / Try again grading flow that Step 2 (Hallucination Hunt) now has. Q7 (multi-select reflection about the learner's own work) stays ungraded — it's a reflection, not a knowledge check.

## Scope

All edits inside `src/components/assess/modules/M01Work.tsx` and the `PARAMETER_QUIZ` constant. No schema changes, no other steps touched.

## Changes

1. **`PARAMETER_QUIZ`** — Add `correct` + one-line `explanation` to each of the six single-choice questions in Step 3 (Q1–Q6). Q7 stays as the open multi-select reflection and is rendered separately.

2. **`ParameterNotes` interface** — Add `quizChecked?: boolean`.

3. **`setParameterQuizAnswer`** — When the learner edits any of the six graded answers, set `quizChecked: false` so they must re-confirm. Editing Q7 does not flip the flag.

4. **Handlers** — Add `handleCheckParameters` and `handleRetryParameters` that toggle `quizChecked` (mirrors the Step 2 implementation).

5. **Pass threshold** — `parameterQuizPassed = quizChecked && correctCount >= 5` (5 / 6, same ratio as Step 2's 4 / 5).

6. **Continue gating** — Replace the current `parameterQuizComplete` check inside `parameterStepComplete` with `parameterQuizPassed`. Update `disabledReason` to walk through: "Answer all six checks" → "Click Check answers" → "Review highlighted answers and try again" → existing reasons for control matches / Part B checks / Q7 / acknowledgement.

7. **Quiz rendering (Q1–Q6 loop, ~lines 1497–1529)** — When `quizChecked` is true:
   - Green border + ✓ on correct, red border + ✗ on incorrect
   - "Why: …" explanation under each graded question
   - Inputs disabled until Try again
8. **Buttons under the six questions** — "Check answers" (disabled until all 6 answered) and "Try again" (only when `!parameterQuizPassed && quizChecked`), plus an "X of 6 correct" result line. Same visual treatment as Step 2.

## Out of scope

- Q7 reflection (kept ungraded)
- Part A dial cards, Part B task guide, control-match exercise, prompt-controls section
- Method note section
- Any other module

## Verification

Run `tsc --noEmit` after the edit; spot-check the rendered Step 3 in the preview to confirm grading + gating behave like Step 2.
