## Why it overflows

`TokenVisualization` renders each token as an inline `<span>`. Two things together let the row escape the box on long inputs:

1. Inside each chip we replace every regular space with `\u00A0` (non-breaking space). That tells the browser "never break here," so the whole sentence behaves like one unbreakable word.
2. The container has no wrap fallback — no `break-words`, no `overflow-wrap: anywhere`, no `overflow-x: hidden`.

The Token IDs view has the same risk (long comma-separated list); it already has `break-all`, but the parent should still clip as a safety net.

## Fix

In `src/components/tokenizer/HoiTokenizer.tsx`:

1. **Container** (the `div` at line 347): add wrap + clip classes so nothing can ever push past the border:
   - `overflow-hidden` + `[overflow-wrap:anywhere]` (or `break-words`).

2. **TokenChip** (line 371): allow line breaks between tokens while still preserving the visible space inside a token.
   - Render a normal space (` `) instead of NBSP in `visibleTokenText`, OR
   - Keep the visual look with NBSP but add `inline-block` + `max-w-full` + `[overflow-wrap:anywhere]` on the chip so very long single tokens also wrap.
   - Recommended: switch the space replacement to a regular space and keep `white-space: pre-wrap` (preserves runs of spaces visually but still allows wrapping between tokens).

3. No behaviour, no logic, no styling-token changes — purely a wrap/overflow fix on these two elements.

## Out of scope

- No changes to tokenizer logic, colors, stats, or layout of the surrounding card.
- No changes to the Language Tax panel (its textareas already wrap correctly).
