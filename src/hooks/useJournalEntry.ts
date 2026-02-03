import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

export interface JournalEntry {
  id: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  theme_id: string | null;
  visualization_id: string | null;
  mood: string | null;
  emotion: string | null;
  // Sprint: Chips - new fields for "Outro" option
  mood_other: string | null;
  emotion_other: string | null;
  insight: string | null;
  action: string | null;
  gratitude: string | null;
  free_note: string | null;
  tags: string[] | null;
}

export interface JournalFormData {
  mood: string;
  emotion: string;
  // Sprint: Chips - fields for "Outro" option
  moodOther: string;
  emotionOther: string;
  insight: string;
  action: string;
  gratitude: string;
  free_note: string;
}

const EMPTY_FORM: JournalFormData = {
  mood: '',
  emotion: '',
  moodOther: '',
  emotionOther: '',
  insight: '',
  action: '',
  gratitude: '',
  free_note: '',
};

// Get current user ID
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Hook for today's journal entry
export function useJournalEntry(date?: string) {
  const today = date || format(new Date(), 'yyyy-MM-dd');
  const { toast } = useToast();
  
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [formData, setFormData] = useState<JournalFormData>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load entry for today
  useEffect(() => {
    const fetchEntry = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('entry_date', today)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setEntry(data as JournalEntry);
          setFormData({
            mood: data.mood || '',
            emotion: data.emotion || '',
            moodOther: data.mood_other || '',
            emotionOther: data.emotion_other || '',
            insight: data.insight || '',
            action: data.action || '',
            gratitude: data.gratitude || '',
            free_note: data.free_note || '',
          });
          setLastSavedAt(new Date(data.updated_at));
        } else {
          setEntry(null);
          setFormData(EMPTY_FORM);
          setLastSavedAt(null);
        }
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error fetching journal entry:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o diário.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntry();
  }, [today, toast]);

  // Update form field
  const updateField = useCallback((field: keyof JournalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  // Save entry
  const save = useCallback(async (
    themeId?: string | null,
    visualizationId?: string | null
  ) => {
    setIsSaving(true);
    try {
      const userId = await getCurrentUserId();
      const payload = {
        entry_date: today,
        user_id: userId,
        theme_id: themeId || null,
        visualization_id: visualizationId || null,
        mood: formData.mood.trim() || null,
        emotion: formData.emotion.trim() || null,
        mood_other: formData.moodOther.trim() || null,
        emotion_other: formData.emotionOther.trim() || null,
        insight: formData.insight.trim() || null,
        action: formData.action.trim() || null,
        gratitude: formData.gratitude.trim() || null,
        free_note: formData.free_note.trim() || null,
      };

      let result;
      if (entry?.id) {
        // Update existing
        result = await supabase
          .from('journal_entries')
          .update(payload)
          .eq('id', entry.id)
          .select()
          .single();
      } else {
        // Insert new
        result = await supabase
          .from('journal_entries')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setEntry(result.data as JournalEntry);
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);

      toast({
        title: 'Salvo!',
        description: `Diário salvo às ${format(new Date(), 'HH:mm')}`,
      });

      return true;
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o diário.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [today, entry, formData, toast]);

  // Clear form (not delete from DB)
  const clearForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    setHasUnsavedChanges(true);
  }, []);

  return {
    entry,
    formData,
    updateField,
    save,
    clearForm,
    isLoading,
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
  };
}

// Hook for journal history
export function useJournalHistory(options?: {
  themeId?: string | null;
  searchQuery?: string;
}) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('journal_entries')
          .select('*')
          .order('entry_date', { ascending: false });

        if (options?.themeId) {
          query = query.eq('theme_id', options.themeId);
        }

        const { data, error } = await query;
        if (error) throw error;

        let results = (data || []) as JournalEntry[];

        // Client-side text search
        if (options?.searchQuery) {
          const q = options.searchQuery.toLowerCase();
          results = results.filter(e => 
            (e.insight?.toLowerCase().includes(q)) ||
            (e.action?.toLowerCase().includes(q)) ||
            (e.free_note?.toLowerCase().includes(q)) ||
            (e.mood?.toLowerCase().includes(q)) ||
            (e.emotion?.toLowerCase().includes(q)) ||
            (e.gratitude?.toLowerCase().includes(q))
          );
        }

        setEntries(results);
      } catch (error) {
        console.error('Error fetching journal history:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o histórico.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [options?.themeId, options?.searchQuery, toast]);

  return { entries, isLoading };
}

// Hook for journal stats
export function useJournalStats() {
  const [stats, setStats] = useState({
    daysLast30: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
        const todayStr = format(today, 'yyyy-MM-dd');

        // Get entries from last 30 days
        const { data, error } = await supabase
          .from('journal_entries')
          .select('entry_date')
          .gte('entry_date', thirtyDaysAgo)
          .lte('entry_date', todayStr)
          .order('entry_date', { ascending: false });

        if (error) throw error;

        const entries = data || [];
        const daysLast30 = entries.length;

        // Calculate streak
        let currentStreak = 0;
        const entryDates = new Set(entries.map(e => e.entry_date));
        
        // Check from today backwards
        let checkDate = today;
        while (true) {
          const dateStr = format(checkDate, 'yyyy-MM-dd');
          if (entryDates.has(dateStr)) {
            currentStreak++;
            checkDate = subDays(checkDate, 1);
          } else {
            break;
          }
        }

        setStats({ daysLast30, currentStreak });
      } catch (error) {
        console.error('Error fetching journal stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading };
}

// Export to CSV
export function exportJournalToCSV(entries: JournalEntry[]): void {
  const headers = [
    'Data',
    'Humor',
    'Emoção',
    'Insight',
    'Ação',
    'Gratidão',
    'Nota Livre',
    'Tema ID',
    'Visualização ID',
    'Criado em',
    'Atualizado em',
  ];

  const rows = entries.map(e => [
    e.entry_date,
    e.mood || '',
    e.emotion || '',
    e.insight || '',
    e.action || '',
    e.gratitude || '',
    e.free_note || '',
    e.theme_id || '',
    e.visualization_id || '',
    e.created_at,
    e.updated_at,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or newline
        const escaped = String(cell).replace(/"/g, '""');
        return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `diario-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
