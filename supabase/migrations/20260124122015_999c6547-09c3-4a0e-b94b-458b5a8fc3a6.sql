-- Add micro-chunking TTS pacing settings for meditation mode
-- These enable dynamic word-based pacing instead of punctuation-only

-- Change default rate to 0.62 (slower for better meditation)
ALTER TABLE public.settings ALTER COLUMN tts_rate SET DEFAULT 0.62;

-- Add new pacing columns
ALTER TABLE public.settings 
  ADD COLUMN IF NOT EXISTS tts_pause_base_ms integer NOT NULL DEFAULT 220,
  ADD COLUMN IF NOT EXISTS tts_pause_per_word_ms integer NOT NULL DEFAULT 65,
  ADD COLUMN IF NOT EXISTS tts_pause_sentence_extra_ms integer NOT NULL DEFAULT 450,
  ADD COLUMN IF NOT EXISTS tts_pause_paragraph_extra_ms integer NOT NULL DEFAULT 900,
  ADD COLUMN IF NOT EXISTS tts_breath_pause_ms integer NOT NULL DEFAULT 1700,
  ADD COLUMN IF NOT EXISTS tts_microchunk_min_words integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS tts_microchunk_max_words integer NOT NULL DEFAULT 14;

-- Update existing rows with new default values
UPDATE public.settings 
SET 
  tts_rate = 0.62,
  tts_pause_base_ms = 220,
  tts_pause_per_word_ms = 65,
  tts_pause_sentence_extra_ms = 450,
  tts_pause_paragraph_extra_ms = 900,
  tts_breath_pause_ms = 1700,
  tts_microchunk_min_words = 8,
  tts_microchunk_max_words = 14
WHERE tts_pause_base_ms IS NULL OR tts_pause_base_ms = 0;