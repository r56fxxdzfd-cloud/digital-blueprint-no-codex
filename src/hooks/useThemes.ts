import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Theme } from '@/lib/database.types';

export function useThemes() {
  const queryClient = useQueryClient();

  const { data: themes = [], isLoading } = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Theme[];
    },
  });

  const activeThemes = themes.filter((t) => t.is_active);

  const createTheme = useMutation({
    mutationFn: async (theme: { name: string; description?: string | null; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('themes')
        .insert([theme])
        .select()
        .single();

      if (error) throw error;
      return data as Theme;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    },
  });

  const updateTheme = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Theme> & { id: string }) => {
      const { data, error } = await supabase
        .from('themes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Theme;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    },
  });

  return { themes, activeThemes, isLoading, createTheme, updateTheme };
}
