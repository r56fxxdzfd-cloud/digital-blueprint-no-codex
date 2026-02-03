-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  quote_text TEXT NOT NULL,
  author TEXT,
  source TEXT,
  source_type TEXT NOT NULL DEFAULT 'other' CHECK (source_type IN ('person', 'anonymous', 'book', 'proverb', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT quote_text_length CHECK (char_length(quote_text) <= 240),
  CONSTRAINT source_length CHECK (source IS NULL OR char_length(source) <= 120)
);

-- Create daily_quotes table
CREATE TABLE public.daily_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_daily_quote UNIQUE(entry_date, language)
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;

-- RLS policies for quotes (read-only for app, admin manages via direct access)
CREATE POLICY "Allow read on quotes" ON public.quotes FOR SELECT USING (true);
CREATE POLICY "Allow all on quotes" ON public.quotes FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for daily_quotes
CREATE POLICY "Allow read on daily_quotes" ON public.daily_quotes FOR SELECT USING (true);
CREATE POLICY "Allow all on daily_quotes" ON public.daily_quotes FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_quotes_language_theme ON public.quotes(language, theme_id) WHERE is_active = true;
CREATE INDEX idx_daily_quotes_date_language ON public.daily_quotes(entry_date, language);