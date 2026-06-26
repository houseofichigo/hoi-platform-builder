-- Restore the set_use_case_approval_workspace trigger function so the
-- subsequent linter-hardening migrations (20260626225900, 20260626225922)
-- can REVOKE EXECUTE on it during a fresh `supabase db reset`.
-- The function already exists in the live cloud DB; this migration is a
-- no-op there (CREATE OR REPLACE) and creates it on fresh resets.

CREATE OR REPLACE FUNCTION public.set_use_case_approval_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'use_case_approvals'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_use_case_approval_workspace_trg ON public.use_case_approvals';
    EXECUTE 'CREATE TRIGGER set_use_case_approval_workspace_trg
             BEFORE INSERT ON public.use_case_approvals
             FOR EACH ROW EXECUTE FUNCTION public.set_use_case_approval_workspace()';
  END IF;
END $$;
