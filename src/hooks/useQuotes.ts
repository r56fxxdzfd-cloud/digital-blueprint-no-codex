import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface Quote {
  id: string;
  language: string;
  theme_id: string | null;
  quote_text: string;
  author: string | null;
  source: string | null;
  source_type: 'person' | 'anonymous' | 'book' | 'proverb' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyQuote {
  id: string;
  entry_date: string;
  language: string;
  theme_id: string | null;
  quote_id: string;
  created_at: string;
  quote?: Quote;
}

// Deterministic selection based on date + theme + language
function getDeterministicIndex(date: string, themeId: string | null, language: string, arrayLength: number): number {
  if (arrayLength === 0) return 0;
  const seed = `${date}-${themeId || 'general'}-${language}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % arrayLength;
}

export async function getOrCreateDailyQuote(
  date: Date,
  language: string,
  themeId: string | null
): Promise<Quote | null> {
  const dateStr = format(date, 'yyyy-MM-dd');

  // 1. Check if daily quote already exists
  const { data: existing } = await supabase
    .from('daily_quotes')
    .select('*, quote:quotes(*)')
    .eq('entry_date', dateStr)
    .eq('language', language)
    .maybeSingle();

  if (existing?.quote) {
    return existing.quote as unknown as Quote;
  }

  // 2. Fetch quotes for theme
  let { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .eq('language', language)
    .eq('is_active', true)
    .eq('theme_id', themeId || '');

  // 3. If no theme quotes, fallback to general quotes
  if (!quotes || quotes.length === 0) {
    const { data: generalQuotes } = await supabase
      .from('quotes')
      .select('*')
      .eq('language', language)
      .eq('is_active', true)
      .is('theme_id', null);
    
    quotes = generalQuotes;
  }

  // Still no quotes? Try any active quote
  if (!quotes || quotes.length === 0) {
    const { data: anyQuotes } = await supabase
      .from('quotes')
      .select('*')
      .eq('language', language)
      .eq('is_active', true)
      .limit(10);
    
    quotes = anyQuotes;
  }

  if (!quotes || quotes.length === 0) {
    return null;
  }

  // 4. Deterministic selection
  const index = getDeterministicIndex(dateStr, themeId, language, quotes.length);
  const selectedQuote = quotes[index] as Quote;

  // 5. Insert into daily_quotes (upsert to handle existing)
  await supabase
    .from('daily_quotes')
    .upsert({
      entry_date: dateStr,
      language,
      theme_id: themeId,
      quote_id: selectedQuote.id,
    }, { onConflict: 'entry_date,language' })
    .select()
    .maybeSingle();

  return selectedQuote;
}

export function useDailyQuote(date: Date, language: string, themeId: string | null) {
  const queryClient = useQueryClient();
  const dateStr = format(date, 'yyyy-MM-dd');

  const query = useQuery({
    queryKey: ['daily-quote', dateStr, language, themeId],
    queryFn: () => getOrCreateDailyQuote(date, language, themeId),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!language,
  });

  const changeQuote = useMutation({
    mutationFn: async () => {
      // Get current quote to exclude it
      const currentQuoteId = query.data?.id;

      // Fetch all quotes for theme
      let { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('language', language)
        .eq('is_active', true)
        .eq('theme_id', themeId || '');

      // If no theme quotes, fallback to general
      if (!quotes || quotes.length === 0) {
        const { data: generalQuotes } = await supabase
          .from('quotes')
          .select('*')
          .eq('language', language)
          .eq('is_active', true)
          .is('theme_id', null);
        quotes = generalQuotes;
      }

      // Fallback to any quotes
      if (!quotes || quotes.length === 0) {
        const { data: anyQuotes } = await supabase
          .from('quotes')
          .select('*')
          .eq('language', language)
          .eq('is_active', true)
          .limit(10);
        quotes = anyQuotes;
      }

      if (!quotes || quotes.length === 0) return null;

      // Filter out current quote and pick random
      const availableQuotes = quotes.filter(q => q.id !== currentQuoteId);
      if (availableQuotes.length === 0) return query.data; // Only one quote available

      const randomIndex = Math.floor(Math.random() * availableQuotes.length);
      const newQuote = availableQuotes[randomIndex] as Quote;

      // Update daily_quotes
      await supabase
        .from('daily_quotes')
        .upsert({
          entry_date: dateStr,
          language,
          theme_id: themeId,
          quote_id: newQuote.id,
        }, { onConflict: 'entry_date,language' });

      return newQuote;
    },
    onSuccess: (newQuote) => {
      if (newQuote) {
        queryClient.setQueryData(['daily-quote', dateStr, language, themeId], newQuote);
      }
    },
  });

  return {
    ...query,
    changeQuote: changeQuote.mutateAsync,
    isChanging: changeQuote.isPending,
  };
}

export function useQuotes(language?: string, themeId?: string | null) {
  return useQuery({
    queryKey: ['quotes', language, themeId],
    queryFn: async () => {
      let query = supabase
        .from('quotes')
        .select('*, theme:themes(name)')
        .order('created_at', { ascending: false });

      if (language) {
        query = query.eq('language', language);
      }
      
      if (themeId !== undefined) {
        if (themeId === null) {
          query = query.is('theme_id', null);
        } else if (themeId) {
          query = query.eq('theme_id', themeId);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Quote & { theme: { name: string } | null })[];
    },
  });
}

export function useQuoteStats() {
  return useQuery({
    queryKey: ['quote-stats'],
    queryFn: async () => {
      const { data: quotes } = await supabase
        .from('quotes')
        .select('language, theme_id, themes(name)')
        .eq('is_active', true);

      if (!quotes) return { byLanguage: {}, byTheme: {} };

      const byLanguage: Record<string, number> = {};
      const byTheme: Record<string, { count: number; name: string }> = {};

      quotes.forEach((q: any) => {
        byLanguage[q.language] = (byLanguage[q.language] || 0) + 1;
        
        if (q.theme_id) {
          if (!byTheme[q.theme_id]) {
            byTheme[q.theme_id] = { count: 0, name: q.themes?.name || 'Unknown' };
          }
          byTheme[q.theme_id].count++;
        } else {
          if (!byTheme['general']) {
            byTheme['general'] = { count: 0, name: 'Geral (fallback)' };
          }
          byTheme['general'].count++;
        }
      });

      return { byLanguage, byTheme };
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('quotes')
        .insert(quote)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote-stats'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quote> & { id: string }) => {
      const { data, error } = await supabase
        .from('quotes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote-stats'] });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotes')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote-stats'] });
    },
  });
}
