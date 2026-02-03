-- Tabela de configurações (row única)
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  default_theme_mode TEXT NOT NULL DEFAULT 'auto' CHECK (default_theme_mode IN ('auto', 'manual')),
  no_repeat_days INT NOT NULL DEFAULT 14,
  preferred_duration_min INT NOT NULL DEFAULT 4,
  theme_lookback_days INT NOT NULL DEFAULT 14,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de temas
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de visualizações
CREATE TABLE public.visualizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  script TEXT NOT NULL,
  duration_min INT NOT NULL DEFAULT 4,
  energy_min INT NOT NULL DEFAULT 0 CHECK (energy_min >= 0 AND energy_min <= 10),
  energy_max INT NOT NULL DEFAULT 10 CHECK (energy_max >= 0 AND energy_max <= 10),
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de entradas diárias
CREATE TABLE public.daily_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  visualization_id UUID REFERENCES public.visualizations(id) ON DELETE SET NULL,
  energy INT CHECK (energy >= 0 AND energy <= 10),
  identity TEXT,
  critical_action TEXT,
  action_done BOOLEAN NOT NULL DEFAULT false,
  evidence TEXT,
  autopilot TEXT,
  tomorrow_adjustment TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de revisões semanais
CREATE TABLE public.weekly_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL UNIQUE,
  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  wins TEXT,
  hard_truth TEXT,
  self_deception_pattern TEXT,
  bottleneck_habit TEXT,
  one_action TEXT,
  stop_rule TEXT,
  score_0_10 INT CHECK (score_0_10 >= 0 AND score_0_10 <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_visualizations_theme_id ON public.visualizations(theme_id);
CREATE INDEX idx_visualizations_is_active ON public.visualizations(is_active);
CREATE INDEX idx_daily_entries_date ON public.daily_entries(date);
CREATE INDEX idx_daily_entries_theme_id ON public.daily_entries(theme_id);
CREATE INDEX idx_weekly_reviews_week_start ON public.weekly_reviews(week_start_date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON public.themes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visualizations_updated_at BEFORE UPDATE ON public.visualizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_entries_updated_at BEFORE UPDATE ON public.daily_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_reviews_updated_at BEFORE UPDATE ON public.weekly_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS (app pessoal, sem auth - políticas permissivas para todas as operações)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (app pessoal, single user)
CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on themes" ON public.themes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on visualizations" ON public.visualizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_entries" ON public.daily_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on weekly_reviews" ON public.weekly_reviews FOR ALL USING (true) WITH CHECK (true);