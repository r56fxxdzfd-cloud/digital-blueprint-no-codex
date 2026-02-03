-- Fix 1: Secure the trigger function with SECURITY INVOKER and fixed search_path
-- This prevents potential privilege escalation and search_path manipulation attacks
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY INVOKER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix 2: Add database constraints for input validation on daily_entries
-- This ensures server-side validation that cannot be bypassed via direct API calls

-- Constraint: evidence must be at least 20 characters when provided
ALTER TABLE public.daily_entries
ADD CONSTRAINT evidence_min_length
CHECK (evidence IS NULL OR length(evidence) >= 20);

-- Constraint: critical_action must be at least 10 characters when provided
ALTER TABLE public.daily_entries
ADD CONSTRAINT critical_action_min_length
CHECK (critical_action IS NULL OR length(critical_action) >= 10);

-- Constraint: completed entries must have valid evidence
ALTER TABLE public.daily_entries
ADD CONSTRAINT completed_requires_evidence
CHECK (
  (completed_at IS NULL) OR
  (completed_at IS NOT NULL AND evidence IS NOT NULL AND length(evidence) >= 20)
);