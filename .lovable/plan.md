## Plan: Export Chapter 2 Content Brief as Markdown

Generate a detailed markdown document covering the full Chapter 2 (M02 — Data Readiness & Knowledge Base Preparation) brief and save it as a downloadable artifact.

### Steps

1. Re-read `src/lib/assess/content/m02.ts` and `src/components/m03/.../M02Step3Guided.tsx` (and the blueprint builder) to make sure every section, framework list, panel, and output is captured verbatim where it matters (5 use cases, 3 knowledge layers, 5 required + 7 advanced metadata fields, 5 entry types, 5 retrieval test patterns, 12 Gate 1 checks, 8 reason codes, 7 guided panels, 5-section generated blueprint).

2. Write a single markdown file to `/mnt/documents/chapter-02-brief.md` with this structure:
   - Module Identity (title, default use case, bridge from M01, method note)
   - **Part A — Course Overview**
     - Use case selector
     - Three knowledge layers
     - Steps 1–3 walkthrough
     - Reference frameworks (all enumerated lists)
     - OCR worked-example notes
   - **Part B — Assignment (Step 3 Guided Build)**
     - The 7 sequential panels with what each captures
     - Closing Decision Panel (readiness status + explanation)
     - Generated Blueprint Output (5 sections) and PDF/Markdown artefact
     - Gate 1 progression rule (PASS / PARTIAL / BLOCKED → M03)
   - Quick-reference appendix tables (metadata fields, entry types, retrieval tests, reason codes)

3. Emit a `<presentation-artifact>` tag pointing to `chapter-02-brief.md` so the user can preview/download it.

### Out of scope

- No app code, route, or UI changes.
- No edits to the M02 content itself — this is a read-only export.
