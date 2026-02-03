-- Add Gratitude Section structured columns to daily_sessions
-- Sprint: Gratitude Section for Morning and Night sessions

ALTER TABLE public.daily_sessions 
  ADD COLUMN IF NOT EXISTS morning_gratitude_text TEXT,
  ADD COLUMN IF NOT EXISTS morning_gratitude_category TEXT CHECK (morning_gratitude_category IN ('Self', 'Relationships', 'Work', 'Nature/God', 'Circumstance')),
  ADD COLUMN IF NOT EXISTS night_gratitude_text TEXT;

-- Add constraint for morning_gratitude_text length (100 chars max)
ALTER TABLE public.daily_sessions
  ADD CONSTRAINT morning_gratitude_text_length CHECK (char_length(morning_gratitude_text) <= 100);

-- Add constraint for night_gratitude_text length (100 chars max)
ALTER TABLE public.daily_sessions
  ADD CONSTRAINT night_gratitude_text_length CHECK (char_length(night_gratitude_text) <= 100);

COMMENT ON COLUMN public.daily_sessions.morning_gratitude_text IS 'Morning gratitude text (max 100 chars)';
COMMENT ON COLUMN public.daily_sessions.morning_gratitude_category IS 'Category of morning gratitude: Self, Relationships, Work, Nature/God, Circumstance';
COMMENT ON COLUMN public.daily_sessions.night_gratitude_text IS 'Night gratitude/closure text (max 100 chars)';