-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add user_id column to tables that need per-user data
-- Update daily_entries to use proper UUID user_id
ALTER TABLE public.daily_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update daily_sessions user_id to proper UUID type
ALTER TABLE public.daily_sessions DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.daily_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update journal_entries user_id to proper UUID type  
ALTER TABLE public.journal_entries DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.journal_entries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update weekly_reviews to add user_id
ALTER TABLE public.weekly_reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update notification_settings user_id to proper UUID type
ALTER TABLE public.notification_settings DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.notification_settings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update push_subscriptions user_id to proper UUID type
ALTER TABLE public.push_subscriptions DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.push_subscriptions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies and create proper per-user RLS policies

-- daily_entries policies
DROP POLICY IF EXISTS "Allow all on daily_entries" ON public.daily_entries;
CREATE POLICY "Users can view their own entries"
ON public.daily_entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
ON public.daily_entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
ON public.daily_entries FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
ON public.daily_entries FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- daily_sessions policies
DROP POLICY IF EXISTS "Allow all on daily_sessions" ON public.daily_sessions;
CREATE POLICY "Users can view their own sessions"
ON public.daily_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
ON public.daily_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.daily_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.daily_sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- journal_entries policies
DROP POLICY IF EXISTS "Allow all on journal_entries" ON public.journal_entries;
CREATE POLICY "Users can view their own journal entries"
ON public.journal_entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
ON public.journal_entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
ON public.journal_entries FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
ON public.journal_entries FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- weekly_reviews policies
DROP POLICY IF EXISTS "Allow all on weekly_reviews" ON public.weekly_reviews;
CREATE POLICY "Users can view their own reviews"
ON public.weekly_reviews FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews"
ON public.weekly_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.weekly_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.weekly_reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- notification_settings policies
DROP POLICY IF EXISTS "Allow all on notification_settings" ON public.notification_settings;
CREATE POLICY "Users can view their own settings"
ON public.notification_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.notification_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.notification_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- push_subscriptions policies
DROP POLICY IF EXISTS "Allow all on push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own subscriptions"
ON public.push_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
ON public.push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.push_subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.push_subscriptions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Keep themes, visualizations, quotes, and settings as public read (they're shared content)
-- themes - already has RLS, keep read access
DROP POLICY IF EXISTS "Allow all on themes" ON public.themes;
CREATE POLICY "Anyone can read themes"
ON public.themes FOR SELECT
TO authenticated
USING (true);

-- visualizations - keep read access for authenticated users
DROP POLICY IF EXISTS "Allow all on visualizations" ON public.visualizations;
CREATE POLICY "Anyone can read visualizations"
ON public.visualizations FOR SELECT
TO authenticated
USING (true);

-- settings - global settings, read only
DROP POLICY IF EXISTS "Allow all on settings" ON public.settings;
CREATE POLICY "Anyone can read settings"
ON public.settings FOR SELECT
TO authenticated
USING (true);