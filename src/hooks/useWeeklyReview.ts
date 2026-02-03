import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WeeklyReview } from '@/lib/database.types';
import { format, startOfWeek } from 'date-fns';

// Get current user ID
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function useWeeklyReview(weekStartDate?: Date) {
  const queryClient = useQueryClient();
  const dateStr = weekStartDate 
    ? format(startOfWeek(weekStartDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    : format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: review, isLoading } = useQuery({
    queryKey: ['weekly-review', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('week_start_date', dateStr)
        .maybeSingle();

      if (error) throw error;
      return data as WeeklyReview | null;
    },
  });

  const createReview = useMutation({
    mutationFn: async (review: Partial<WeeklyReview>) => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('weekly_reviews')
        .insert({ ...review, week_start_date: dateStr, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data as WeeklyReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-review', dateStr] });
    },
  });

  const updateReview = useMutation({
    mutationFn: async (updates: Partial<WeeklyReview>) => {
      if (!review?.id) throw new Error('No review found');
      
      const { data, error } = await supabase
        .from('weekly_reviews')
        .update(updates)
        .eq('id', review.id)
        .select()
        .single();

      if (error) throw error;
      return data as WeeklyReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-review', dateStr] });
    },
  });

  const saveReview = async (data: Partial<WeeklyReview>) => {
    if (review) {
      return updateReview.mutateAsync(data);
    } else {
      return createReview.mutateAsync(data);
    }
  };

  return { review, isLoading, saveReview, createReview, updateReview };
}
