-- Create notification_settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  enabled BOOLEAN NOT NULL DEFAULT false,
  morning_enabled BOOLEAN NOT NULL DEFAULT true,
  morning_time TIME NOT NULL DEFAULT '08:30',
  midday_enabled BOOLEAN NOT NULL DEFAULT false,
  midday_time TIME NOT NULL DEFAULT '12:30',
  evening_enabled BOOLEAN NOT NULL DEFAULT true,
  evening_time TIME NOT NULL DEFAULT '20:30',
  message_morning TEXT NOT NULL DEFAULT 'Pausa rápida: faça sua visualização do dia.',
  message_midday TEXT NOT NULL DEFAULT 'Volte ao centro: 60 segundos de presença.',
  message_evening TEXT NOT NULL DEFAULT 'Fechamento do dia: registre 1 insight e 1 ação.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for single-user MVP (null user_id)
CREATE UNIQUE INDEX notification_settings_user_unique ON public.notification_settings (COALESCE(user_id, ''));

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for all access (MVP without auth)
CREATE POLICY "Allow all on notification_settings" 
ON public.notification_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create push_subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for endpoint per user
CREATE UNIQUE INDEX push_subscriptions_user_endpoint_unique ON public.push_subscriptions (COALESCE(user_id, ''), endpoint);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for all access (MVP without auth)
CREATE POLICY "Allow all on push_subscriptions" 
ON public.push_subscriptions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create notification_delivery_log table for tracking
CREATE TABLE public.notification_delivery_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NULL,
  notification_type TEXT NOT NULL, -- 'morning', 'midday', 'evening'
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'skipped'
  error TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- Create policy for all access
CREATE POLICY "Allow all on notification_delivery_log" 
ON public.notification_delivery_log 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add trigger for updated_at on notification_settings
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on push_subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();