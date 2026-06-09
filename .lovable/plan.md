## Add screenshot to Step 4 of "Build your own Custom GPT SOP"

Step 4 in `COACH_STEPS` is **"Copy the Draft System Prompt"** and currently has no image. The uploaded screenshot shows the GPT Builder Coach with the drafted instructions ready to copy — a perfect fit.

### Changes

1. Copy the uploaded screenshot to `public/images/m04/gpt-builder-coach-sop/04-copy-draft-prompt.png`.
2. In `src/components/assess/modules/M04Work.tsx`, on the `COACH_STEPS` entry titled "Copy the Draft System Prompt" (line 237–240), add:
   ```ts
   image: "/images/m04/gpt-builder-coach-sop/04-copy-draft-prompt.png",
   ```

No other steps or copy change.

### Note (carryover from prior plan)

These `public/images/...` references still render in the Vite dev preview but 404 on the published Worker build (no Cloudflare `assets` binding). Migrating all M04 screenshots to Lovable Assets CDN is the proper fix and is tracked in the previous plan. This change keeps consistency with the existing pattern; the Lovable Assets migration can sweep them all together later.
