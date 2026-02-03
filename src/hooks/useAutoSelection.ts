import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Theme, Visualization, DailyEntry, Settings } from '@/lib/database.types';
import { format, subDays } from 'date-fns';

interface AutoSelectionParams {
  themes: Theme[];
  entries: DailyEntry[];
  settings: Settings | undefined;
}

export function useAutoThemeSelection({ themes, entries, settings }: AutoSelectionParams) {
  return useMemo(() => {
    if (!settings || themes.length === 0) return null;

    const activeThemes = themes.filter((t) => t.is_active);
    if (activeThemes.length === 0) return null;

    const lookbackDays = settings.theme_lookback_days;
    const cutoffDate = format(subDays(new Date(), lookbackDays), 'yyyy-MM-dd');
    
    // Count theme usage in lookback period
    const recentEntries = entries.filter((e) => e.date >= cutoffDate && e.theme_id);
    const themeUsageCount: Record<string, number> = {};
    
    activeThemes.forEach((t) => {
      themeUsageCount[t.id] = 0;
    });
    
    recentEntries.forEach((e) => {
      if (e.theme_id && themeUsageCount[e.theme_id] !== undefined) {
        themeUsageCount[e.theme_id]++;
      }
    });

    // Find minimum usage count
    const minUsage = Math.min(...Object.values(themeUsageCount));
    const leastUsedThemes = activeThemes.filter((t) => themeUsageCount[t.id] === minUsage);

    if (leastUsedThemes.length === 1) {
      return leastUsedThemes[0];
    }

    // Tiebreaker: oldest last usage
    const themeLastUsage: Record<string, string | null> = {};
    leastUsedThemes.forEach((t) => {
      const lastEntry = entries
        .filter((e) => e.theme_id === t.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      themeLastUsage[t.id] = lastEntry?.date || null;
    });

    leastUsedThemes.sort((a, b) => {
      const dateA = themeLastUsage[a.id];
      const dateB = themeLastUsage[b.id];
      if (!dateA && !dateB) return 0;
      if (!dateA) return -1;
      if (!dateB) return 1;
      return dateA.localeCompare(dateB);
    });

    return leastUsedThemes[0];
  }, [themes, entries, settings]);
}

export async function selectVisualization(
  themeId: string,
  energy: number | null,
  settings: Settings,
  excludeVisualizationId?: string
): Promise<Visualization | null> {
  const { data: allVisualizations, error: vizError } = await supabase
    .from('visualizations')
    .select('*')
    .eq('theme_id', themeId)
    .eq('is_active', true);

  if (vizError || !allVisualizations || allVisualizations.length === 0) {
    return null;
  }

  // Get recently used visualization IDs
  const cutoffDate = format(subDays(new Date(), settings.no_repeat_days), 'yyyy-MM-dd');
  const { data: recentEntries } = await supabase
    .from('daily_entries')
    .select('visualization_id')
    .gte('date', cutoffDate)
    .not('visualization_id', 'is', null);

  const recentlyUsedIds = new Set((recentEntries || []).map((e) => e.visualization_id));

  // Filter by energy if provided
  let candidates = allVisualizations;
  
  if (energy !== null) {
    const energyFiltered = candidates.filter(
      (v) => energy >= v.energy_min && energy <= v.energy_max
    );
    if (energyFiltered.length > 0) {
      candidates = energyFiltered;
    }
  }

  // Exclude current visualization when switching.
  // If energy-filtering leaves only the current visualization, fallback to any other
  // visualization in the same theme (ignore energy) to guarantee a visible change.
  if (excludeVisualizationId) {
    const withoutCurrent = candidates.filter((v) => v.id !== excludeVisualizationId);
    if (withoutCurrent.length > 0) {
      candidates = withoutCurrent;
    } else {
      const fullWithoutCurrent = allVisualizations.filter((v) => v.id !== excludeVisualizationId);
      if (fullWithoutCurrent.length > 0) {
        candidates = fullWithoutCurrent;
      }
    }
  }

  // Apply anti-repetition
  let nonRepeatedCandidates = candidates.filter((v) => !recentlyUsedIds.has(v.id));
  
  if (nonRepeatedCandidates.length === 0) {
    // Fallback: allow repetition
    nonRepeatedCandidates = candidates;
  }

  // Sort by last_used_at (null first, then oldest)
  nonRepeatedCandidates.sort((a, b) => {
    if (!a.last_used_at && !b.last_used_at) return 0;
    if (!a.last_used_at) return -1;
    if (!b.last_used_at) return 1;
    return a.last_used_at.localeCompare(b.last_used_at);
  });

  return nonRepeatedCandidates[0] as Visualization || null;
}

export async function confirmVisualization(visualizationId: string): Promise<void> {
  await supabase
    .from('visualizations')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', visualizationId);
}

export async function findAlternativeTheme(
  excludeThemeId: string
): Promise<{ theme: Theme; visualizationCount: number } | null> {
  const { data: themes } = await supabase
    .from('themes')
    .select('*')
    .eq('is_active', true)
    .neq('id', excludeThemeId);

  if (!themes || themes.length === 0) return null;

  const themeCounts: { theme: Theme; count: number }[] = [];

  for (const theme of themes) {
    const { count } = await supabase
      .from('visualizations')
      .select('*', { count: 'exact', head: true })
      .eq('theme_id', theme.id)
      .eq('is_active', true);

    themeCounts.push({ theme: theme as Theme, count: count || 0 });
  }

  themeCounts.sort((a, b) => b.count - a.count);

  if (themeCounts[0]?.count > 0) {
    return { theme: themeCounts[0].theme, visualizationCount: themeCounts[0].count };
  }

  return null;
}
