## Problem

You just added a **Check answers** flow to the Six quick checks in Step 1 (token quiz). The Hallucination Hunt quiz in Step 2 (Q1–Q6 of SCEPTICISM_QUIZ in `M01Work.tsx`) still uses the old behavior: learners pick answers, no grading happens, and Continue unlocks as soon as every question has a selection. That's what "still the old one" is referring to.

## Plan

Apply the same Check-answers pattern to the Hallucination Hunt quiz.

### 1. Add `correct` + `explanation` to SCEPTICISM_QUIZ

Q1–Q6 are all single-choice and all have an objectively right answer. Proposed keys + one-line explanations:

- **Q1** → "Plausible, confident information that is incorrect or fabricated" — Hallucinations are confident, plausible-sounding fabrications, not random noise or refusals.
- **Q2** → "The specific figures may be fabricated until verified" — Precise numbers without sources are the classic hallucination signature; treat as unverified.
- **Q3** → "The model may be inventing rather than retrieving a stable fact" — Drift across fresh chats signals generation, not retrieval of a stable fact.
- **Q4** → "I do not have specific information; share a source and I can help" — An honest abstain with a request for a source carries the lowest fabrication risk.
- **Q5** → "Run the Hallucination Audit prompt on the draft" — A structured audit catches fabricated claims; asking the model to self-check or trusting tone does not.
- **Q6** → "They are trained and evaluated in ways that reward attempting answers over abstaining" — Training/eval incentives push models toward attempting answers rather than abstaining.

### 2. Track `quizChecked` on `ScepticismLog`

Add `quizChecked?: boolean` to the `ScepticismLog` interface and to the initial state. When the learner edits any quiz answer via `setScepticismQuizAnswer`, set `quizChecked: false` so they re-confirm.

### 3. Add Check answers / Try again buttons

Below the 6 questions, render:
- **Check answers** button — disabled until every Q1–Q6 has an answer. On click, set `quizChecked: true`.
- After checking, render a results line: "X of 6 correct" plus a **Try again** button that sets `quizChecked: false` (answers preserved, styling clears).

### 4. Graded styling per question

When `quizChecked` is true, for each question:
- Selected option turns green if correct, red if wrong.
- Correct option is highlighted (green border / check icon) so the learner sees the right answer.
- One-line "Why:" explanation appears below.
- Inputs disabled until Try again is clicked.

### 5. Gate Continue on score

Replace the existing `quizComplete` check in `stepComplete` with `quizPassed = quizChecked && correctCount >= 5` (5 of 6 — same spirit as the 4/5 threshold on the token quiz, scaled to 6 gradable questions). Update `disabledReason` to walk through: "Answer all six, then confirm…" → "Click Check answers" → "Review highlighted answers and try again" → existing reasons for exercises / risk tasks / acknowledgement.

### Out of scope

- Q7 (risk-task multi-select) — stays as a reflection question, no grading, still required to have ≥1 selection.
- The Part A exercise checkboxes, examples, prompt techniques — unchanged.
- Other modules' quizzes.

### Technical notes

All edits are inside `src/components/assess/modules/M01Work.tsx`. No schema changes — `quizChecked` lives inside the existing `m01.scepticism_log` JSON output. No new design tokens.
