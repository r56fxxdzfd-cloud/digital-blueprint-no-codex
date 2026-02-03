-- Create journal_entries table for daily micro-journaling
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id TEXT NULL,
  theme_id UUID NULL,
  visualization_id UUID NULL,
  mood TEXT NULL,
  emotion TEXT NULL,
  insight TEXT NULL,
  action TEXT NULL,
  gratitude TEXT NULL,
  free_note TEXT NULL,
  tags TEXT[] NULL DEFAULT '{}'::text[],
  
  -- Unique constraint per user per day (user_id can be null for MVP)
  CONSTRAINT journal_entries_unique_date UNIQUE (entry_date, user_id)
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Allow all operations (same pattern as other tables in this project)
CREATE POLICY "Allow all on journal_entries" 
ON public.journal_entries 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_journal_entries_entry_date ON public.journal_entries(entry_date DESC);
CREATE INDEX idx_journal_entries_theme_id ON public.journal_entries(theme_id);

-- Add comments for documentation
COMMENT ON TABLE public.journal_entries IS 'Daily micro-journal entries for quick reflection';
COMMENT ON COLUMN public.journal_entries.mood IS 'Single word mood (e.g., calmo, ansioso)';
COMMENT ON COLUMN public.journal_entries.emotion IS 'Single word emotion (e.g., gratidão, medo)';
COMMENT ON COLUMN public.journal_entries.insight IS 'One short insight (max 160 chars)';
COMMENT ON COLUMN public.journal_entries.action IS 'One small action (max 160 chars)';
COMMENT ON COLUMN public.journal_entries.gratitude IS 'Optional gratitude note (max 160 chars)';
COMMENT ON COLUMN public.journal_entries.free_note IS 'Optional free-form note (max 800 chars)';