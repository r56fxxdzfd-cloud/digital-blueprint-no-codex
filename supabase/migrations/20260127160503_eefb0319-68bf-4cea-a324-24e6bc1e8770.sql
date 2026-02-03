-- Add column for custom meditation duration
ALTER TABLE public.daily_sessions
ADD COLUMN morning_meditation_duration integer NULL;