import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Sun, Moon, BookOpen } from 'lucide-react';
import { useAllDailySessions, DailySession } from '@/hooks/useDailySession';
import { useThemes } from '@/hooks/useThemes';
import { useJournalHistory } from '@/hooks/useJournalEntry';
import { useDailyQuote } from '@/hooks/useQuotes';
import { DaySummaryDrawer } from '@/components/DaySummaryDrawer';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DayStatus = 'completed' | 'morning' | 'evening' | 'registered' | 'none';

interface CalendarDayData {
  date: Date;
  session: DailySession | null;
  hasJournal: boolean;
  status: DayStatus;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const { sessions } = useAllDailySessions();
  const { themes } = useThemes();
  const { entries: journalEntries } = useJournalHistory();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create lookup maps for quick access
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, DailySession>();
    sessions.forEach(s => map.set(s.entry_date, s));
    return map;
  }, [sessions]);

  const journalByDate = useMemo(() => {
    const set = new Set<string>();
    journalEntries.forEach(j => set.add(j.entry_date));
    return set;
  }, [journalEntries]);

  const getDayData = (date: Date): CalendarDayData => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const session = sessionsByDate.get(dateStr) || null;
    const hasJournal = journalByDate.has(dateStr);
    
    let status: DayStatus = 'none';
    if (session?.day_completed) {
      status = 'completed';
    } else if (session?.morning_completed && !session?.evening_completed) {
      status = 'morning';
    } else if (!session?.morning_completed && session?.evening_completed) {
      status = 'evening';
    } else if (session || hasJournal) {
      status = 'registered';
    }
    
    return { date, session, hasJournal, status };
  };

  const getStatusStyles = (status: DayStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-primary/20 text-primary ring-1 ring-primary/30';
      case 'morning':
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30';
      case 'evening':
        return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-500/30';
      case 'registered':
        return 'bg-muted text-muted-foreground';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: DayStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'morning':
        return <Sun className="h-3 w-3" />;
      case 'evening':
        return <Moon className="h-3 w-3" />;
      case 'registered':
        return <Circle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleDayClick = (dayData: CalendarDayData) => {
    if (dayData.status !== 'none') {
      setSelectedDay(dayData);
      setDrawerOpen(true);
    }
  };

  const getTheme = (themeId: string | null) => {
    if (!themeId) return null;
    return themes.find(t => t.id === themeId) || null;
  };

  // Pad days to start on Monday
  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Get journal data for selected day
  const selectedJournal = selectedDay 
    ? journalEntries.find(j => j.entry_date === format(selectedDay.date, 'yyyy-MM-dd'))
    : null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Legend */}
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-4 justify-center text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
                  <CheckCircle className="h-2.5 w-2.5 text-primary" />
                </div>
                <span>Dia concluído</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-500/20 flex items-center justify-center">
                  <Sun className="h-2.5 w-2.5 text-amber-600" />
                </div>
                <span>Manhã concluída</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-indigo-500/20 flex items-center justify-center">
                  <Moon className="h-2.5 w-2.5 text-indigo-600" />
                </div>
                <span>Noite concluída</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
                  <Circle className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
                <span>Registrado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="py-2 font-medium text-muted-foreground">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: paddingDays }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map(day => {
                const dayData = getDayData(day);
                const hasActivity = dayData.status !== 'none';
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(dayData)}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                      transition-colors relative
                      ${isToday(day) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                      ${hasActivity ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                      ${getStatusStyles(dayData.status)}
                    `}
                  >
                    <span className={isToday(day) ? 'font-bold' : ''}>
                      {format(day, 'd')}
                    </span>
                    {hasActivity && (
                      <div className="absolute bottom-1">
                        {getStatusIcon(dayData.status)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day Summary Drawer */}
        <DaySummaryDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          session={selectedDay?.session || null}
          date={selectedDay?.date || new Date()}
          theme={selectedDay?.session?.theme_id ? getTheme(selectedDay.session.theme_id) : null}
          journalInsight={selectedJournal?.insight}
          journalAction={selectedJournal?.action}
        />
      </div>
    </Layout>
  );
}
