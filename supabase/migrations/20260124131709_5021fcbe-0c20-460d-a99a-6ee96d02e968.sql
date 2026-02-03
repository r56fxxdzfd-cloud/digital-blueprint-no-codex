-- Add outro fields to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS tts_outro_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS tts_outro_text text NOT NULL DEFAULT 'Agora… fique em silêncio… e apenas sinta…

Se pensamentos vierem… deixe passar…

Quando desejar… traga atenção para o corpo…

sentindo os pés… as mãos… e a respiração…

E volte devagar… abrindo os olhos no seu tempo.';