/**
 * Daily Session Hook
 * Sprint: Data Input Refactor - Audit/Structured Data
 * 
 * New structured fields:
 * - quote_absorbed: boolean (morning)
 * - main_intention: text max 50 chars (morning)
 * - clarity_level: 1-5 (morning)
 * - action_category: Work/Health/Relationships/Spiritual (morning)
 * - emotional_zone: Red/Yellow/Blue/Green (night - Yale Mood Meter)
 * - presence_score: 0-100 (night)
 * - failure_reason: Procrastination/Fatigue/Planning/External/Forgot (night)
 * - daily_win: text (night)
 * - daily_loss: text (night)
 * - energy_delta: computed (morning_energy - evening_energy)
 * - critical_action_completed: boolean
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ActionCategory } from '@/components/ActionCategorySelect';
import { EmotionalZone } from '@/components/MoodMeterTiles';
import { FailureReason } from '@/components/FailureReasonSelect';
import { GratitudeCategory } from '@/components/GratitudeCard';

export interface DailySession {
  id: string;
  entry_date: string;
  user_id: string | null;
  theme_id: string | null;
  quote_id: string | null;
  morning_visualization_id: string | null;
  morning_energy: number | null;
  morning_meditation_completed: boolean;
  morning_journal_completed: boolean;
  morning_action_completed: boolean;
  morning_completed: boolean;
  morning_meditation_duration: number | null;
  evening_energy: number | null;
  evening_checkout_completed: boolean;
  evening_completed: boolean;
  day_completed: boolean;
  // Sprint: Core Habit Loop - existing fields
  obstacle: string | null;
  rule_for_tomorrow: string | null;
  // Sprint: Data Input Refactor - new structured fields
  quote_absorbed: boolean;
  main_intention: string | null;
  clarity_level: number | null;
  action_category: ActionCategory | null;
  emotional_zone: EmotionalZone | null;
  presence_score: number | null;
  failure_reason: FailureReason | null;
  daily_win: string | null;
  daily_loss: string | null;
  energy_delta: number | null;
  critical_action_completed: boolean;
  // Sprint: Gratitude Section
  morning_gratitude_text: string | null;
  morning_gratitude_category: GratitudeCategory | null;
  night_gratitude_text: string | null;
  created_at: string;
  updated_at: string;
}

// Compute derived flags based on completion state
// These flags remain for backwards compatibility but the UI now uses calculateMorningProgress/calculateNightProgress
function computeFlags(session: Partial<DailySession>): Partial<DailySession> {
  // Morning is complete when: quote absorbed, intention set, clarity rated, action + category set, gratitude category set
  const morningCompleted = 
    !!session.quote_absorbed &&
    !!(session.main_intention && session.main_intention.trim().length > 0) &&
    !!(session.clarity_level && session.clarity_level > 0) &&
    !!session.action_category &&
    !!session.morning_gratitude_category;
  
  // Evening is complete when checkout is done (this is set explicitly by handleFinalize)
  const eveningCompleted = !!session.evening_checkout_completed;
  
  const dayCompleted = morningCompleted && eveningCompleted;

  return {
    ...session,
    morning_completed: morningCompleted,
    evening_completed: eveningCompleted,
    day_completed: dayCompleted,
  };
}

// Get current user ID
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function useDailySession(date?: Date) {
  const queryClient = useQueryClient();
  const dateStr = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['daily-session', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_sessions')
        .select('*')
        .eq('entry_date', dateStr)
        .maybeSingle();

      if (error) throw error;
      return data as DailySession | null;
    },
  });

  const createSession = useMutation({
    mutationFn: async (sessionData: Partial<DailySession>) => {
      const userId = await getCurrentUserId();
      const flagged = computeFlags(sessionData);
      
      // Remove energy_delta as it's a generated column and cannot be inserted
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { energy_delta, ...insertData } = flagged;
      
      const { data, error } = await supabase
        .from('daily_sessions')
        .insert({ ...insertData, entry_date: dateStr, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data as DailySession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-session', dateStr] });
      queryClient.invalidateQueries({ queryKey: ['daily-sessions'] });
    },
  });

  const updateSession = useMutation({
    mutationFn: async (updates: Partial<DailySession>) => {
      if (!session?.id) throw new Error('No session found');
      
      // Merge updates with current session to compute flags correctly
      const merged = { ...session, ...updates };
      const flagged = computeFlags(merged);
      
      // Remove energy_delta as it's a generated column and cannot be updated
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { energy_delta, ...updateData } = flagged;
      
      const { data, error } = await supabase
        .from('daily_sessions')
        .update(updateData)
        .eq('id', session.id)
        .select()
        .single();

      if (error) throw error;
      return data as DailySession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-session', dateStr] });
      queryClient.invalidateQueries({ queryKey: ['daily-sessions'] });
    },
  });

  const getOrCreateSession = async (initialData?: Partial<DailySession>): Promise<DailySession> => {
    if (session) return session;
    return createSession.mutateAsync(initialData || {});
  };

  // Mark meditation as completed
  const completeMeditation = async () => {
    const sess = await getOrCreateSession();
    return updateSession.mutateAsync({ morning_meditation_completed: true });
  };

  // Mark journal as completed
  const completeJournal = async () => {
    const sess = await getOrCreateSession();
    return updateSession.mutateAsync({ morning_journal_completed: true });
  };

  // Toggle action completed
  const toggleAction = async (done: boolean) => {
    const sess = await getOrCreateSession();
    return updateSession.mutateAsync({ morning_action_completed: done });
  };

  // Complete evening checkout
  const completeEveningCheckout = async (eveningEnergy?: number) => {
    const sess = await getOrCreateSession();
    return updateSession.mutateAsync({
      evening_checkout_completed: true,
      evening_energy: eveningEnergy ?? null,
    });
  };

  return {
    session,
    isLoading,
    error,
    createSession,
    updateSession,
    getOrCreateSession,
    completeMeditation,
    completeJournal,
    toggleAction,
    completeEveningCheckout,
  };
}

// Hook for fetching all sessions (for calendar/insights)
export function useAllDailySessions() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['daily-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_sessions')
        .select('*')
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return data as DailySession[];
    },
  });

  return { sessions, isLoading };
}

// Hook for fetching sessions in a date range
export function useDailySessions(days: number = 30) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['daily-sessions', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('daily_sessions')
        .select('*')
        .gte('entry_date', format(startDate, 'yyyy-MM-dd'))
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return data as DailySession[];
    },
  });

  return { sessions, isLoading };
}
