-- Create daily_sessions table for tracking morning/evening session progress
CREATE TABLE public.daily_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL,
  user_id TEXT NULL,
  theme_id UUID NULL,
  quote_id UUID NULL,
  morning_visualization_id UUID NULL,
  morning_energy INTEGER NULL CHECK (morning_energy >= 1 AND morning_energy <= 10),
  morning_meditation_completed BOOLEAN NOT NULL DEFAULT false,
  morning_journal_completed BOOLEAN NOT NULL DEFAULT false,
  morning_action_completed BOOLEAN NOT NULL DEFAULT false,
  morning_completed BOOLEAN NOT NULL DEFAULT false,
  evening_energy INTEGER NULL CHECK (evening_energy >= 1 AND evening_energy <= 10),
  evening_checkout_completed BOOLEAN NOT NULL DEFAULT false,
  evening_completed BOOLEAN NOT NULL DEFAULT false,
  day_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for single-user MVP (entry_date only)
ALTER TABLE public.daily_sessions ADD CONSTRAINT daily_sessions_entry_date_key UNIQUE (entry_date);

-- Enable RLS
ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for all operations
CREATE POLICY "Allow all on daily_sessions" ON public.daily_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_daily_sessions_updated_at
  BEFORE UPDATE ON public.daily_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();