-- Sprint: Data Input Refactor - Shift from Diary/Text to Audit/Structured Data
-- Adds structured fields for better analytics and audit capabilities

-- Morning structured fields
ALTER TABLE public.daily_sessions ADD COLUMN IF NOT EXISTS quote_absorbed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.daily_sessions ADD COLUMN IF NOT EXISTS main_intention TEXT;
ALTER TABLE public.daily_sessions ADD COLUMN IF NOT EXISTS clarity_level INTEGER;
ALTER TABLE public.daily_sessions ADD COLUMN IF NOT EXISTS action_category TEXT;

-- Night structured fields
ALTER TABLE public.daily_sessions ADD COLUMN IF NOT EXISTS emotional_zone TEXT;
ALTER TABLE public.daily_sessions ADD COLUMN IF NOT EXISTS presence_score INTEGER;
ALTER TABLE public.daily_sessions ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE public.daily_sessions ADD COLUMN IF NOT EXISTS daily_win TEXT;
ALTER TABLE public.daily_sessions ADD COLUMN IF NOT EXISTS daily_loss TEXT;

-- Energy delta is computed, but we can add it as a generated column
ALTER TABLE public.daily_sessions ADD COLUMN IF NOT EXISTS energy_delta INTEGER GENERATED ALWAYS AS (morning_energy - evening_energy) STORED;

-- Rename for clarity: critical_action_completed mirrors the action done flag
ALTER TABLE public.daily_sessions ADD COLUMN IF NOT EXISTS critical_action_completed BOOLEAN DEFAULT FALSE;

-- Add constraints for data validation
ALTER TABLE public.daily_sessions ADD CONSTRAINT check_clarity_level 
  CHECK (clarity_level IS NULL OR (clarity_level >= 1 AND clarity_level <= 5));

ALTER TABLE public.daily_sessions ADD CONSTRAINT check_presence_score 
  CHECK (presence_score IS NULL OR (presence_score >= 0 AND presence_score <= 100));

ALTER TABLE public.daily_sessions ADD CONSTRAINT check_action_category
  CHECK (action_category IS NULL OR action_category IN ('Work', 'Health', 'Relationships', 'Spiritual'));

ALTER TABLE public.daily_sessions ADD CONSTRAINT check_emotional_zone
  CHECK (emotional_zone IS NULL OR emotional_zone IN ('Red', 'Yellow', 'Blue', 'Green'));

ALTER TABLE public.daily_sessions ADD CONSTRAINT check_failure_reason
  CHECK (failure_reason IS NULL OR failure_reason IN ('Procrastination', 'Fatigue', 'Planning', 'External', 'Forgot'));

ALTER TABLE public.daily_sessions ADD CONSTRAINT check_main_intention_length
  CHECK (main_intention IS NULL OR length(main_intention) <= 50);

-- Comment for documentation
COMMENT ON COLUMN public.daily_sessions.quote_absorbed IS 'Did the user read/internalize the quote?';
COMMENT ON COLUMN public.daily_sessions.main_intention IS 'Short intention for the day (max 50 chars)';
COMMENT ON COLUMN public.daily_sessions.clarity_level IS 'Visualization clarity level 1-5';
COMMENT ON COLUMN public.daily_sessions.action_category IS 'Category: Work, Health, Relationships, Spiritual';
COMMENT ON COLUMN public.daily_sessions.emotional_zone IS 'Yale Mood Meter zone: Red, Yellow, Blue, Green';
COMMENT ON COLUMN public.daily_sessions.presence_score IS 'Level of presence 0-100%';
COMMENT ON COLUMN public.daily_sessions.failure_reason IS 'If action not completed: Procrastination, Fatigue, Planning, External, Forgot';
COMMENT ON COLUMN public.daily_sessions.daily_win IS 'What went well today?';
COMMENT ON COLUMN public.daily_sessions.daily_loss IS 'What went wrong today?';
COMMENT ON COLUMN public.daily_sessions.energy_delta IS 'Calculated: morning_energy - evening_energy';
COMMENT ON COLUMN public.daily_sessions.critical_action_completed IS 'Was the critical action completed?';