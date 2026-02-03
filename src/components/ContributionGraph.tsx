import { useMemo } from 'react';
import { format, subDays, startOfWeek, getDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DailySession } from '@/hooks/useDailySession';

interface ContributionGraphProps {
  sessions: DailySession[];
  days?: number;
}

type ActivityLevel = 0 | 1 | 2 | 3 | 4;

interface DayData {
  date: string;
  level: ActivityLevel;
  morningCompleted: boolean;
  eveningCompleted: boolean;
  dayCompleted: boolean;
  hasJournal: boolean;
}

export function ContributionGraph({ sessions, days = 30 }: ContributionGraphProps) {
  const graphData = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, days - 1);
    
    // Create a map of session data by date
    const sessionMap = new Map<string, DailySession>();
    sessions.forEach(s => sessionMap.set(s.entry_date, s));
    
    // Generate all days
    const allDays: DayData[] = [];
    for (let i = 0; i < days; i++) {
      const date = subDays(today, days - 1 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const session = sessionMap.get(dateStr);
      
      // Calculate activity level (0-4)
      let level: ActivityLevel = 0;
      if (session) {
        if (session.day_completed) {
          level = 4; // Full day completed
        } else if (session.morning_completed && session.evening_completed) {
          level = 4;
        } else if (session.morning_completed || session.evening_completed) {
          level = 3;
        } else if (session.morning_meditation_completed || session.morning_journal_completed) {
          level = 2;
        } else if (session.morning_energy !== null || session.evening_energy !== null) {
          level = 1;
        }
      }
      
      allDays.push({
        date: dateStr,
        level,
        morningCompleted: session?.morning_completed ?? false,
        eveningCompleted: session?.evening_completed ?? false,
        dayCompleted: session?.day_completed ?? false,
        hasJournal: session?.morning_journal_completed ?? false,
      });
    }
    
    // Group by weeks (columns)
    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];
    
    allDays.forEach((day, index) => {
      const dayOfWeek = getDay(new Date(day.date));
      
      // Start new week on Sunday (or first day)
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentWeek.push(day);
    });
    
    // Don't forget last week
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return { allDays, weeks };
  }, [sessions, days]);

  const getLevelColor = (level: ActivityLevel): string => {
    switch (level) {
      case 0: return 'bg-muted/30';
      case 1: return 'bg-primary/20';
      case 2: return 'bg-primary/40';
      case 3: return 'bg-primary/60';
      case 4: return 'bg-primary';
    }
  };

  const getTooltipContent = (day: DayData): string => {
    const dateFormatted = format(new Date(day.date), "d 'de' MMMM", { locale: ptBR });
    const parts: string[] = [dateFormatted];
    
    if (day.dayCompleted) {
      parts.push('✅ Dia completo');
    } else {
      if (day.morningCompleted) parts.push('🌅 Manhã completa');
      if (day.eveningCompleted) parts.push('🌙 Noite completa');
      if (day.hasJournal && !day.morningCompleted) parts.push('📝 Diário registrado');
      if (day.level === 0) parts.push('Sem atividade');
    }
    
    return parts.join('\n');
  };

  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 text-xs text-muted-foreground">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-3 w-4 flex items-center justify-center">
              {i % 2 === 1 && label}
            </div>
          ))}
        </div>
        
        {/* Graph grid */}
        <TooltipProvider delayDuration={0}>
          <div className="flex gap-1 overflow-x-auto">
            {graphData.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {/* Pad the first week if it doesn't start on Sunday */}
                {weekIndex === 0 && week.length < 7 && (
                  <>
                    {Array.from({ length: 7 - week.length }).map((_, i) => (
                      <div key={`pad-${i}`} className="w-3 h-3" />
                    ))}
                  </>
                )}
                {week.map((day) => (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'w-3 h-3 rounded-sm cursor-pointer transition-colors hover:ring-1 hover:ring-primary/50',
                          getLevelColor(day.level)
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="whitespace-pre-line text-xs">
                      {getTooltipContent(day)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Menos</span>
        <div className="flex gap-1">
          <div className={cn('w-3 h-3 rounded-sm', getLevelColor(0))} />
          <div className={cn('w-3 h-3 rounded-sm', getLevelColor(1))} />
          <div className={cn('w-3 h-3 rounded-sm', getLevelColor(2))} />
          <div className={cn('w-3 h-3 rounded-sm', getLevelColor(3))} />
          <div className={cn('w-3 h-3 rounded-sm', getLevelColor(4))} />
        </div>
        <span>Mais</span>
      </div>
    </div>
  );
}
