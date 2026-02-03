-- Sprint: Core Habit Loop + SOS + Chips + Focus Mode + Dynamic Prompts
-- This migration adds fields for mood/emotion chips system and morning→night accountability loop

-- Add mood_other and emotion_other columns to journal_entries for "Outro" option storage
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS mood_other text,
ADD COLUMN IF NOT EXISTS emotion_other text;

-- Add obstacle and rule_for_tomorrow columns to daily_sessions for night checkout
ALTER TABLE public.daily_sessions
ADD COLUMN IF NOT EXISTS obstacle text,
ADD COLUMN IF NOT EXISTS rule_for_tomorrow text;

-- Comments documenting the new fields
COMMENT ON COLUMN public.journal_entries.mood_other IS 'Custom text when user selects "outro" as mood chip';
COMMENT ON COLUMN public.journal_entries.emotion_other IS 'Custom text when user selects "outro" as emotion chip';
COMMENT ON COLUMN public.daily_sessions.obstacle IS 'Obstacle that prevented critical action completion (max 160 chars)';
COMMENT ON COLUMN public.daily_sessions.rule_for_tomorrow IS 'Se X, então Y rule for tomorrow (max 160 chars)';