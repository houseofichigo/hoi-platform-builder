Extract the DiagramStep (map process canvas) and all its helper components from the monolithic builder route into a clean, standalone downloadable file.

**Scope**
- Source file: `src/routes/app.$workspaceSlug.build.process.new.tsx` (4,649 lines).
- Target: `/mnt/documents/MapProcessDiagram.tsx` (and a `MapProcessDiagram-types.ts` if needed).

**What will be extracted**
1. **DiagramStep** component (the canvas + toolbars + stepper + metrics footer).
2. **Direct helpers** rendered by DiagramStep:
   - `BuilderStageStepper`
   - `CanvasToolbar`
   - `TriggerPicker`
   - `NodeToolPicker`
   - `ToolActionChooser`
   - `ToolActionSelect`
   - `CopilotDrawer`
   - `SidePanel` (node inspector)
   - `PanelSection`, `DataProfileSummary`, `BriefPreview`, `TriggerConfigFields`, `DataChips`, `QualityControl`
   - `IconButton`, `PlaceholderButton`, `Metric`
3. **Utility functions** called by the above:
   - `isProcessNode`, `hydrateNode`, `nodeIssues`, `deriveDiagram`, `deriveStepData`
   - `formatToolActionGroup`, `rolePhrase`, `inferToolRole`, `isGenericStepLabel`
   - `profileFrom`, `qualityFrom`, `manualProfile`, `outputFromToolAction`, `roleFromToolAction`
   - `nodeKindLabel`, `kindIcon`, `statusChips` (if any)
4. **Required types & constants** defined in the same file:
   - `BuilderData`, `BuilderNode`, `ProcessBuilderNode`, `StickyBuilderNode`, `BuilderEdge`, `NodePickerTarget`, `DiagramSnapshot`, `ProcessBuilderDraft`, `StickyData`
   - `LayoutDirection`, `BuilderStep`, `StartPanelMode`, `OpenNodePickerDetail`
   - `defaultFrame`, `defaultGlobalPass`, `processBuilderDraftKey`
   - `nodeKinds`, `inputTypes`, `drawerRootRows`, `processCategoryActions`, `stepTemplates`
   - `eventTriggerOptions`, `criticalityOptions`, `toolRoleOptions`, `customEventValue`

**How external dependencies will be handled**
- Project-specific hooks (e.g., `useToolCatalog`, `useEnsureOrgToolFromCatalog`, `useToolActions`, `useMembers`, `useDataSources`, `useDepartments`, `useDiagramAssistant`, `useCreateSubmittedProcess`) will be left as imports from their existing paths. A `README` block at the top of the file will list the required internal modules.
- UI primitives (`Button`, `Input`, `Badge`, `Select`, `Card`, `Textarea`, `Progress`, `Label`, `AlertDialog`) will remain imported from `@/components/ui/...`.
- `@xyflow/react` imports and `lucide-react` icons will stay as-is.
- The extracted file will be **syntactically valid TypeScript/TSX**, but it will rely on the consuming project to provide the listed internal hooks/types.

**Deliverable**
- `/mnt/documents/MapProcessDiagram.tsx` (single file, or split into `MapProcessDiagram.tsx` + `MapProcessDiagram-types.ts` if it exceeds readable length).
- A short dependency map comment at the top so you know what internal modules you must port to use it elsewhere.

**Out of scope**
- Frame step form fields
- Submit / review step
- Start choice overlay / template browser / AI draft panel
- Route-level wiring (auth gate, navigation, draft persistence logic)