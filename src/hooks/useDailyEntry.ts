import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyEntry } from '@/lib/database.types';
import { format } from 'date-fns';

// Get current user ID
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function useDailyEntry(date?: Date) {
  const queryClient = useQueryClient();
  const dateStr = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

  const { data: entry, isLoading } = useQuery({
    queryKey: ['daily-entry', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('date', dateStr)
        .maybeSingle();

      if (error) throw error;
      return data as DailyEntry | null;
    },
  });

  const createEntry = useMutation({
    mutationFn: async (entry: Partial<DailyEntry>) => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('daily_entries')
        .insert({ ...entry, date: dateStr, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data as DailyEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-entry', dateStr] });
      queryClient.invalidateQueries({ queryKey: ['daily-entries'] });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async (updates: Partial<DailyEntry>) => {
      if (!entry?.id) throw new Error('No entry found');
      
      const { data, error } = await supabase
        .from('daily_entries')
        .update(updates)
        .eq('id', entry.id)
        .select()
        .single();

      if (error) throw error;
      return data as DailyEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-entry', dateStr] });
      queryClient.invalidateQueries({ queryKey: ['daily-entries'] });
    },
  });

  const getOrCreateEntry = async (themeId?: string) => {
    if (entry) return entry;
    
    return createEntry.mutateAsync({ theme_id: themeId });
  };

  return { entry, isLoading, createEntry, updateEntry, getOrCreateEntry };
}

export function useDailyEntries(days: number = 30) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['daily-entries', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;
      return data as DailyEntry[];
    },
  });

  return { entries, isLoading };
}

export function useAllDailyEntries() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['all-daily-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as DailyEntry[];
    },
  });

  return { entries, isLoading };
}
