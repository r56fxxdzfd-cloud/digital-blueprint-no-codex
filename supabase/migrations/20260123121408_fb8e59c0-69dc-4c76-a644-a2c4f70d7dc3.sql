
-- Add TTS settings columns to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS tts_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS tts_rate real NOT NULL DEFAULT 0.90,
ADD COLUMN IF NOT EXISTS tts_pitch real NOT NULL DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS tts_volume real NOT NULL DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS tts_prefer_female boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS tts_voice_uri text NULL;

-- Update existing row if any
UPDATE public.settings SET
  tts_enabled = COALESCE(tts_enabled, true),
  tts_rate = COALESCE(tts_rate, 0.90),
  tts_pitch = COALESCE(tts_pitch, 1.00),
  tts_volume = COALESCE(tts_volume, 1.00),
  tts_prefer_female = COALESCE(tts_prefer_female, true);
