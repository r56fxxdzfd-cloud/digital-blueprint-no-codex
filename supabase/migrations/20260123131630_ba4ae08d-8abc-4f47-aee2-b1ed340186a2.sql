-- Add new meditation mode TTS settings columns
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS tts_pause_ms_comma integer NOT NULL DEFAULT 250,
  ADD COLUMN IF NOT EXISTS tts_pause_ms_ellipsis integer NOT NULL DEFAULT 1300,
  ADD COLUMN IF NOT EXISTS tts_pause_multiplier real NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS tts_target_total_ms integer NOT NULL DEFAULT 150000,
  ADD COLUMN IF NOT EXISTS tts_target_min_ms integer NOT NULL DEFAULT 120000,
  ADD COLUMN IF NOT EXISTS tts_target_max_ms integer NOT NULL DEFAULT 180000,
  ADD COLUMN IF NOT EXISTS tts_fill_mode text NOT NULL DEFAULT 'fill_to_target',
  ADD COLUMN IF NOT EXISTS tts_end_silence_ms integer NOT NULL DEFAULT 30000;

-- Update defaults for existing columns to match meditation pacing
UPDATE public.settings 
SET tts_rate = 0.68,
    tts_sentence_pause_ms = 1100,
    tts_paragraph_pause_ms = 2200
WHERE tts_rate = 0.85 OR tts_rate = 0.90;

-- Set new defaults for future rows
ALTER TABLE public.settings 
  ALTER COLUMN tts_rate SET DEFAULT 0.68,
  ALTER COLUMN tts_sentence_pause_ms SET DEFAULT 1100,
  ALTER COLUMN tts_paragraph_pause_ms SET DEFAULT 2200;