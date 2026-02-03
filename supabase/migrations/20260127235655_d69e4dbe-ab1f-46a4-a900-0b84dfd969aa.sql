-- Add UPDATE and INSERT policies for settings table
-- Allow anyone to update settings (single row table)
CREATE POLICY "Anyone can update settings" 
ON public.settings 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow settings to be created if none exist
CREATE POLICY "Anyone can insert settings" 
ON public.settings 
FOR INSERT 
WITH CHECK (true);