/**
 * Weekly Stats Hook
 * Sprint: Weekly Session Refactor - Dashboard First
 * 
 * Aggregates daily_sessions data for the current week:
 * - Execution Rate: % of days with critical_action_completed = true
 * - Top Saboteur: Most frequent failure_reason
 * - Energy Trend: Avg morning energy this week vs last week
 * - Gratitude Cloud: Top 3 morning_gratitude_category values
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export interface WeeklyStats {
  executionRate: number;
  totalDays: number;
  completedDays: number;
  topSaboteur: string | null;
  saboteurCount: number;
  avgEnergyThisWeek: number | null;
  avgEnergyLastWeek: number | null;
  energyDelta: number | null;
  topGratitudeCategories: { category: string; count: number }[];
}

export function useWeeklyStats(weekStartDate: Date) {
  const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(weekStart, 1);
  const lastWeekEnd = subWeeks(weekEnd, 1);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  const lastWeekStartStr = format(lastWeekStart, 'yyyy-MM-dd');
  const lastWeekEndStr = format(lastWeekEnd, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['weekly-stats', weekStartStr],
    queryFn: async (): Promise<WeeklyStats> => {
      // Fetch this week's sessions
      const { data: thisWeekSessions, error: thisWeekError } = await supabase
        .from('daily_sessions')
        .select('entry_date, critical_action_completed, failure_reason, morning_energy, morning_gratitude_category')
        .gte('entry_date', weekStartStr)
        .lte('entry_date', weekEndStr);

      if (thisWeekError) throw thisWeekError;

      // Fetch last week's sessions for comparison
      const { data: lastWeekSessions, error: lastWeekError } = await supabase
        .from('daily_sessions')
        .select('morning_energy')
        .gte('entry_date', lastWeekStartStr)
        .lte('entry_date', lastWeekEndStr);

      if (lastWeekError) throw lastWeekError;

      const sessions = thisWeekSessions || [];
      const lastSessions = lastWeekSessions || [];

      // Execution Rate
      const totalDays = sessions.length;
      const completedDays = sessions.filter(s => s.critical_action_completed === true).length;
      const executionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      // Top Saboteur
      const failureReasons = sessions
        .map(s => s.failure_reason)
        .filter((r): r is string => r != null && r !== '');
      
      const saboteurCounts: Record<string, number> = {};
      failureReasons.forEach(r => {
        saboteurCounts[r] = (saboteurCounts[r] || 0) + 1;
      });
      
      let topSaboteur: string | null = null;
      let saboteurCount = 0;
      Object.entries(saboteurCounts).forEach(([reason, count]) => {
        if (count > saboteurCount) {
          topSaboteur = reason;
          saboteurCount = count;
        }
      });

      // Energy Trend
      const thisWeekEnergies = sessions
        .map(s => s.morning_energy)
        .filter((e): e is number => e != null);
      const lastWeekEnergies = lastSessions
        .map(s => s.morning_energy)
        .filter((e): e is number => e != null);

      const avgEnergyThisWeek = thisWeekEnergies.length > 0
        ? Math.round((thisWeekEnergies.reduce((a, b) => a + b, 0) / thisWeekEnergies.length) * 10) / 10
        : null;
      const avgEnergyLastWeek = lastWeekEnergies.length > 0
        ? Math.round((lastWeekEnergies.reduce((a, b) => a + b, 0) / lastWeekEnergies.length) * 10) / 10
        : null;
      const energyDelta = avgEnergyThisWeek != null && avgEnergyLastWeek != null
        ? Math.round((avgEnergyThisWeek - avgEnergyLastWeek) * 10) / 10
        : null;

      // Gratitude Cloud
      const gratitudeCategories = sessions
        .map(s => s.morning_gratitude_category)
        .filter((c): c is string => c != null && c !== '');
      
      const categoryCounts: Record<string, number> = {};
      gratitudeCategories.forEach(c => {
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });
      
      const topGratitudeCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, count]) => ({ category, count }));

      return {
        executionRate,
        totalDays,
        completedDays,
        topSaboteur,
        saboteurCount,
        avgEnergyThisWeek,
        avgEnergyLastWeek,
        energyDelta,
        topGratitudeCategories,
      };
    },
  });
}
