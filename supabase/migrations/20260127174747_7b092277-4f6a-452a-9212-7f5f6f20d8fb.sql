-- Fix unique constraints to be per-user instead of global

-- daily_sessions: drop date-only constraint and add (date, user_id) constraint
ALTER TABLE public.daily_sessions DROP CONSTRAINT IF EXISTS daily_sessions_entry_date_key;
ALTER TABLE public.daily_sessions ADD CONSTRAINT daily_sessions_entry_date_user_id_key UNIQUE (entry_date, user_id);

-- daily_entries: drop date-only constraint and add (date, user_id) constraint  
ALTER TABLE public.daily_entries DROP CONSTRAINT IF EXISTS daily_entries_date_key;
ALTER TABLE public.daily_entries ADD CONSTRAINT daily_entries_date_user_id_key UNIQUE (date, user_id);

-- journal_entries: ensure unique constraint is per-user
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_entry_date_key;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_entry_date_user_id_key UNIQUE (entry_date, user_id);