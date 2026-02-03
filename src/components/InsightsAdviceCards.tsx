import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, differenceInDays } from 'date-fns';
import { Battery, AlertTriangle, Zap, BatteryLow, Target, Sparkles } from 'lucide-react';
import { DailyEntry } from '@/lib/database.types';
import { DailySession } from '@/hooks/useDailySession';
import { JournalEntry } from '@/hooks/useJournalEntry';

interface AdviceCard {
  id: string;
  icon: 'battery-low' | 'target' | 'sparkles';
  title: string;
  description: string;
  variant: 'warning' | 'danger' | 'success';
}

interface InsightsAdviceCardsProps {
  entries: DailyEntry[];
  sessions: DailySession[];
  journalEntries: JournalEntry[];
}

export function InsightsAdviceCards({ entries, sessions, journalEntries }: InsightsAdviceCardsProps) {
  const adviceCards = useMemo(() => {
    const cards: AdviceCard[] = [];
    const today = new Date();
    const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
    
    // Filter to last 30 days
    const recentEntries = entries.filter(e => e.date >= thirtyDaysAgo);
    const recentSessions = sessions.filter(s => s.entry_date >= thirtyDaysAgo);
    const recentJournals = journalEntries.filter(j => j.entry_date >= thirtyDaysAgo);
    
    // Sort by date descending
    const sortedEntries = [...recentEntries].sort((a, b) => b.date.localeCompare(a.date));
    const sortedSessions = [...recentSessions].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
    
    // ===== Rule 1: Low Energy =====
    // IF average_energy < 5 for 3 consecutive days
    if (sortedEntries.length >= 3) {
      // Check for 3 consecutive days with low energy
      let consecutiveLowEnergy = 0;
      let prevDate: string | null = null;
      
      for (const entry of sortedEntries) {
        if (entry.energy !== null) {
          // Check if this is consecutive with previous
          if (prevDate) {
            const diff = differenceInDays(new Date(prevDate), new Date(entry.date));
            if (diff !== 1) {
              // Not consecutive, reset counter
              consecutiveLowEnergy = entry.energy < 5 ? 1 : 0;
            } else if (entry.energy < 5) {
              consecutiveLowEnergy++;
            } else {
              consecutiveLowEnergy = 0;
            }
          } else {
            // First entry
            consecutiveLowEnergy = entry.energy < 5 ? 1 : 0;
          }
          
          if (consecutiveLowEnergy >= 3) {
            cards.push({
              id: 'low-energy',
              icon: 'battery-low',
              title: 'Bateria Baixa',
              description: 'Considere uma carga mais leve amanhã. Você teve 3+ dias consecutivos com energia abaixo de 5.',
              variant: 'warning',
            });
            break;
          }
          
          prevDate = entry.date;
        }
      }
    }
    
    // ===== Rule 2: Missing Action =====
    // IF critical_action_completed == false for 3 days
    // We'll use the morning_action_completed from sessions
    if (sortedSessions.length >= 3) {
      let consecutiveMissedActions = 0;
      let prevDate: string | null = null;
      
      for (const session of sortedSessions) {
        // Check if this is consecutive with previous
        if (prevDate) {
          const diff = differenceInDays(new Date(prevDate), new Date(session.entry_date));
          if (diff !== 1) {
            // Not consecutive, reset counter
            consecutiveMissedActions = !session.morning_action_completed ? 1 : 0;
          } else if (!session.morning_action_completed) {
            consecutiveMissedActions++;
          } else {
            consecutiveMissedActions = 0;
          }
        } else {
          // First entry
          consecutiveMissedActions = !session.morning_action_completed ? 1 : 0;
        }
        
        if (consecutiveMissedActions >= 3) {
          cards.push({
            id: 'missing-action',
            icon: 'target',
            title: 'Bloqueio de Ação',
            description: 'Tente definir uma ação menor, de 5 minutos. Você não concluiu a ação crítica por 3+ dias.',
            variant: 'danger',
          });
          break;
        }
        
        prevDate = session.entry_date;
      }
    }
    
    // ===== Rule 3: High Performance =====
    // IF mood == "Focado" AND energy > 8
    // Look for entries where both conditions are met
    const focusedHighEnergyDays = recentJournals.filter(journal => {
      const mood = journal.mood?.toLowerCase().trim();
      const isFocused = mood === 'focado' || mood === 'foco' || mood === 'concentrado';
      
      if (!isFocused) return false;
      
      // Find corresponding daily entry for energy
      const dailyEntry = recentEntries.find(e => e.date === journal.entry_date);
      return dailyEntry && dailyEntry.energy !== null && dailyEntry.energy > 8;
    });
    
    if (focusedHighEnergyDays.length >= 1) {
      cards.push({
        id: 'high-performance',
        icon: 'sparkles',
        title: 'Estado de Pico',
        description: `Você performa melhor quando Focado com alta energia. Proteja esse estado! (${focusedHighEnergyDays.length} ocorrência${focusedHighEnergyDays.length > 1 ? 's' : ''})`,
        variant: 'success',
      });
    }
    
    return cards;
  }, [entries, sessions, journalEntries]);

  const getIcon = (iconType: AdviceCard['icon']) => {
    switch (iconType) {
      case 'battery-low':
        return <BatteryLow className="h-6 w-6" />;
      case 'target':
        return <Target className="h-6 w-6" />;
      case 'sparkles':
        return <Sparkles className="h-6 w-6" />;
    }
  };

  const getVariantStyles = (variant: AdviceCard['variant']) => {
    switch (variant) {
      case 'warning':
        return {
          card: 'border-amber-500/30 bg-amber-500/10',
          icon: 'text-amber-500',
        };
      case 'danger':
        return {
          card: 'border-destructive/30 bg-destructive/10',
          icon: 'text-destructive',
        };
      case 'success':
        return {
          card: 'border-emerald-500/30 bg-emerald-500/10',
          icon: 'text-emerald-500',
        };
    }
  };

  if (adviceCards.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Conselhos Baseados em Regras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {adviceCards.map((card) => {
            const styles = getVariantStyles(card.variant);
            return (
              <div
                key={card.id}
                className={`flex items-start gap-3 p-4 rounded-lg border ${styles.card}`}
              >
                <div className={`mt-0.5 ${styles.icon}`}>
                  {getIcon(card.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{card.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Análise automática baseada nos últimos 30 dias
        </p>
      </CardContent>
    </Card>
  );
}
