import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Visualization } from '@/lib/database.types';

export function useVisualizations(themeId?: string) {
  const queryClient = useQueryClient();

  const { data: visualizations = [], isLoading } = useQuery({
    queryKey: ['visualizations', themeId],
    queryFn: async () => {
      let query = supabase.from('visualizations').select('*').order('title');
      
      if (themeId) {
        query = query.eq('theme_id', themeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Visualization[];
    },
  });

  const createVisualization = useMutation({
    mutationFn: async (visualization: { theme_id: string; title: string; script: string; duration_min?: number; energy_min?: number; energy_max?: number; tags?: string[]; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('visualizations')
        .insert([visualization])
        .select()
        .single();

      if (error) throw error;
      return data as Visualization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visualizations'] });
    },
  });

  const updateVisualization = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Visualization> & { id: string }) => {
      const { data, error } = await supabase
        .from('visualizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Visualization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visualizations'] });
    },
  });

  return { visualizations, isLoading, createVisualization, updateVisualization };
}
