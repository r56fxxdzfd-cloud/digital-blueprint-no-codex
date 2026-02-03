-- Drop existing read policy on quotes first, then recreate it with proper filter
DROP POLICY IF EXISTS "Allow read on quotes" ON public.quotes;

-- quotes - read-only from public, showing only active quotes
CREATE POLICY "Allow read on quotes" ON public.quotes
FOR SELECT USING (is_active = true);

-- notification_delivery_log - read-only from public, edge functions use service role  
DROP POLICY IF EXISTS "Allow read on notification_delivery_log" ON public.notification_delivery_log;
CREATE POLICY "Allow read on notification_delivery_log" ON public.notification_delivery_log
FOR SELECT USING (true);