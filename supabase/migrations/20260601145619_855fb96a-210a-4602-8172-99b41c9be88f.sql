ALTER TABLE public.use_case_approvals
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

UPDATE public.use_case_approvals a
SET workspace_id = u.workspace_id
FROM public.use_cases u
WHERE a.use_case_id = u.id
  AND a.workspace_id IS NULL;

CREATE INDEX IF NOT EXISTS use_case_approvals_workspace_idx
ON public.use_case_approvals (workspace_id);

CREATE OR REPLACE FUNCTION public.set_use_case_approval_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM public.use_cases
    WHERE id = NEW.use_case_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS use_case_approvals_set_workspace ON public.use_case_approvals;
CREATE TRIGGER use_case_approvals_set_workspace
BEFORE INSERT OR UPDATE ON public.use_case_approvals
FOR EACH ROW EXECUTE FUNCTION public.set_use_case_approval_workspace();