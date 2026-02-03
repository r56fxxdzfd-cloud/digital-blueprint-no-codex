-- Add Start/Stop/Continue columns to weekly_reviews for new strategic framework
-- Sprint: Weekly Session Refactor - Dashboard First

ALTER TABLE public.weekly_reviews 
  ADD COLUMN IF NOT EXISTS strategy_start TEXT,
  ADD COLUMN IF NOT EXISTS strategy_stop TEXT,
  ADD COLUMN IF NOT EXISTS strategy_continue TEXT,
  ADD COLUMN IF NOT EXISTS next_week_identity TEXT,
  ADD COLUMN IF NOT EXISTS next_week_goal TEXT;

COMMENT ON COLUMN public.weekly_reviews.strategy_start IS 'Start/Stop/Continue framework: What to start doing';
COMMENT ON COLUMN public.weekly_reviews.strategy_stop IS 'Start/Stop/Continue framework: What to stop doing';
COMMENT ON COLUMN public.weekly_reviews.strategy_continue IS 'Start/Stop/Continue framework: What to continue doing';
COMMENT ON COLUMN public.weekly_reviews.next_week_identity IS 'Intended identity for the upcoming week';
COMMENT ON COLUMN public.weekly_reviews.next_week_goal IS 'Main goal for the upcoming week';