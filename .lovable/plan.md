## Add a "Check answers" step to the Six quick checks

Today the quiz in `M01Work.tsx` only tracks that each question has *an* answer — it never tells the learner if they're right. Add a confirm/grade step so they have to check before continuing.

## Behaviour

1. Add a **Check answers** button below the 6 questions (disabled until all are answered).
2. On click, mark each question as correct / incorrect and show inline feedback:
   - Q1–Q5 (single choice): one correct option. After checking, the chosen option turns green if correct, red if wrong, and the correct option is highlighted. A one-line explanation appears.
   - Q6 (multi, "which tasks in your work…"): subjective — no right/wrong. Show a neutral "Thanks — this is a reflection question" note and count it as automatically valid.
3. Show a results summary: "X of 5 correct" + a "Try again" button that clears the graded state (keeps or clears answers — see open question).
4. Gate the **Continue** button: `canContinue` only becomes true once the learner has clicked Check answers AND scored ≥ 4 / 5 on the gradable questions (Q6 always counts as done). Below the threshold the disabledReason becomes "Review the highlighted answers and try again."

## Implementation notes (technical)

- File: `src/components/assess/modules/M01Work.tsx` only. No content-file changes besides adding a `correct` field.
- Extend `TOKEN_QUIZ` entries with a `correct` field: a string for single-choice, omitted for the multi Q6. Add a short `explanation` string per gradable question.
- Add to the persisted `tokenAwareness` state: `quizChecked: boolean` (so refresh keeps the graded view). Bump nothing else.
- Replace `quizComplete` in the `stepComplete` calc with `quizPassed` derived from `quizChecked && correctCount >= 4`.
- Render logic in the quiz block:
  - Before check: current radio/checkbox UI.
  - After check: lock inputs (`disabled`), color the option rows (`border-emerald-500/60 bg-emerald-500/5` for correct, `border-danger/40 bg-danger/5` for wrong-picked), show ✓ / ✗ icon + `explanation` line under each gradable question.
- "Try again" resets `quizChecked` to false (and optionally clears `quizAnswers`).

## Out of scope

- No changes to other modules' quizzes.
- No new design tokens — reuse existing `terracotta`, `danger`, and add inline emerald utility classes (already used elsewhere in the app).

## Open question

When the learner clicks **Try again**, should their previous answers stay selected (so they only fix the wrong ones) or be cleared entirely? Default in this plan: **keep answers**, just remove the graded styling.
