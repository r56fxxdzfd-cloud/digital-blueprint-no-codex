-- Add TTS pause and chunking settings columns to settings table
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS tts_sentence_pause_ms integer NOT NULL DEFAULT 420,
ADD COLUMN IF NOT EXISTS tts_paragraph_pause_ms integer NOT NULL DEFAULT 900,
ADD COLUMN IF NOT EXISTS tts_max_chunk_chars integer NOT NULL DEFAULT 200;

-- Update default tts_rate to be slower
UPDATE public.settings SET tts_rate = 0.85 WHERE tts_rate = 0.90;