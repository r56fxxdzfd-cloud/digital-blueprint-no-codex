import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationSettings {
  id: string;
  user_id: string | null;
  timezone: string;
  enabled: boolean;
  morning_enabled: boolean;
  morning_time: string;
  midday_enabled: boolean;
  midday_time: string;
  evening_enabled: boolean;
  evening_time: string;
  message_morning: string;
  message_midday: string;
  message_evening: string;
}

// Get current time in a specific timezone
function getCurrentTimeInTimezone(timezone: string): { hours: number; minutes: number } {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    
    const parts = formatter.formatToParts(now);
    const hours = parseInt(parts.find(p => p.type === "hour")?.value || "0");
    const minutes = parseInt(parts.find(p => p.type === "minute")?.value || "0");
    
    return { hours, minutes };
  } catch (error) {
    console.error(`[Scheduler] Invalid timezone: ${timezone}`, error);
    // Fallback to UTC
    const now = new Date();
    return { hours: now.getUTCHours(), minutes: now.getUTCMinutes() };
  }
}

// Parse time string (HH:MM:SS) to hours and minutes
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

// Check if current time matches scheduled time (within 5-minute window)
function isTimeMatch(current: { hours: number; minutes: number }, scheduled: { hours: number; minutes: number }): boolean {
  const currentTotal = current.hours * 60 + current.minutes;
  const scheduledTotal = scheduled.hours * 60 + scheduled.minutes;
  // 5-minute window
  return Math.abs(currentTotal - scheduledTotal) <= 5;
}

// Get today's date key for dedup
function getTodayKey(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security: Require service role key for this function
    // This is called by cron job with proper authorization
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
      console.error("[Scheduler] Unauthorized request - missing or invalid service role key");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("[Scheduler] Starting scheduled notification check...");

    // Get all enabled notification settings
    const { data: allSettings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("enabled", true);

    if (settingsError) {
      console.error("[Scheduler] Failed to fetch settings:", settingsError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!allSettings || allSettings.length === 0) {
      console.log("[Scheduler] No enabled notification settings found");
      return new Response(
        JSON.stringify({ success: true, message: "No enabled settings", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Scheduler] Found ${allSettings.length} enabled setting(s)`);

    let totalSent = 0;
    const errors: string[] = [];

    for (const settings of allSettings as NotificationSettings[]) {
      const currentTime = getCurrentTimeInTimezone(settings.timezone);
      const todayKey = getTodayKey(settings.timezone);
      
      console.log(`[Scheduler] User ${settings.user_id || "default"}: ${currentTime.hours}:${currentTime.minutes} (${settings.timezone})`);

      // Check each notification type
      const notificationsToSend: { type: string; message: string }[] = [];

      if (settings.morning_enabled) {
        const morningTime = parseTime(settings.morning_time);
        if (isTimeMatch(currentTime, morningTime)) {
          notificationsToSend.push({ type: "morning", message: settings.message_morning });
        }
      }

      if (settings.midday_enabled) {
        const middayTime = parseTime(settings.midday_time);
        if (isTimeMatch(currentTime, middayTime)) {
          notificationsToSend.push({ type: "midday", message: settings.message_midday });
        }
      }

      if (settings.evening_enabled) {
        const eveningTime = parseTime(settings.evening_time);
        if (isTimeMatch(currentTime, eveningTime)) {
          notificationsToSend.push({ type: "evening", message: settings.message_evening });
        }
      }

      for (const notification of notificationsToSend) {
        // Check if already sent today
        const { data: existingLog } = await supabase
          .from("notification_delivery_log")
          .select("id")
          .eq("user_id", settings.user_id)
          .eq("notification_type", notification.type)
          .gte("scheduled_for", `${todayKey}T00:00:00`)
          .lt("scheduled_for", `${todayKey}T23:59:59`)
          .eq("status", "sent")
          .maybeSingle();

        if (existingLog) {
          console.log(`[Scheduler] Already sent ${notification.type} today for user ${settings.user_id || "default"}`);
          continue;
        }

        // Get subscriptions for this user
        let query = supabase.from("push_subscriptions").select("*");
        if (settings.user_id) {
          query = query.eq("user_id", settings.user_id);
        }
        
        const { data: subscriptions } = await query;

        if (!subscriptions || subscriptions.length === 0) {
          console.log(`[Scheduler] No subscriptions for user ${settings.user_id || "default"}`);
          continue;
        }

console.log(`[Scheduler] Sending ${notification.type} notification to ${subscriptions.length} device(s)`);

        // Call the push-send function to actually send the notifications
        try {
          const pushResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/push-send`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                user_id: settings.user_id,
                payload: {
                  title: "Blueprint",
                  body: notification.message,
                  url: "/today",
                  icon: "/icons/icon-192x192.png",
                  type: notification.type,
                },
              }),
            }
          );

          const pushResult = await pushResponse.json();
          console.log(`[Scheduler] Push result:`, pushResult);
          
          if (pushResult.success) {
            totalSent += pushResult.sent || 0;
          } else {
            errors.push(`Failed to send ${notification.type}: ${pushResult.error}`);
          }
        } catch (pushError) {
          console.error(`[Scheduler] Push error:`, pushError);
          errors.push(`Push error for ${notification.type}: ${String(pushError)}`);
        }
      }
    }

    console.log(`[Scheduler] Completed - ${totalSent} notification(s) queued`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Scheduler] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
