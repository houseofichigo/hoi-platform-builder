# Move ChatGPT home screenshot to Demo SOP Step 1

The `chatgpt-home.png` screenshot currently appears in the "What is an AI assistant?" section (Step 1 of the chapter). It belongs to Step 1 of the Demo SOP ("Open ChatGPT") instead.

## Changes in `src/components/assess/modules/M04Work.tsx`

1. Add `image: "/images/m04/chatgpt-home.png"` to the first entry of `DEMO_STEPS` ("Open ChatGPT") around line 140–143.
2. Remove the `<figure>` block (lines ~601–611) that renders the same image inside the "What is an AI assistant?" `yourVersion`.

No other copy or logic changes.
