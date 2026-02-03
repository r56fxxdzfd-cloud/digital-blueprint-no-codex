import { useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAllDailyEntries } from '@/hooks/useDailyEntry';
import { useAllDailySessions } from '@/hooks/useDailySession';
import { useThemes } from '@/hooks/useThemes';
import { useJournalHistory } from '@/hooks/useJournalEntry';
import { ContributionGraph } from '@/components/ContributionGraph';
import { InsightsAdviceCards } from '@/components/InsightsAdviceCards';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter } from 'recharts';
import { format, subDays, startOfWeek, eachWeekOfInterval, differenceInDays, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Flame, Target, TrendingUp, Heart, Smile, Zap, CheckCircle, Lightbulb, Battery, Trophy, Calendar, Bookmark, Star, TrendingDown, Clock, AlertTriangle, Moon, Sun, Activity, BarChart3, Grid } from 'lucide-react';

export default function Insights() {
  const { entries } = useAllDailyEntries();
  const { sessions } = useAllDailySessions();
  const { themes } = useThemes();
  const { entries: journalEntries } = useJournalHistory();

  // New KPIs based on daily_sessions
  const sessionStats = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
    
    const last30Sessions = sessions.filter(s => s.entry_date >= thirtyDaysAgo);
    
    const morningCompleted = last30Sessions.filter(s => s.morning_completed).length;
    const eveningCompleted = last30Sessions.filter(s => s.evening_completed).length;
    const dayCompleted = last30Sessions.filter(s => s.day_completed).length;

    // Calculate streaks from day_completed
    const sortedCompleted = sessions
      .filter(s => s.day_completed)
      .map(s => s.entry_date)
      .sort((a, b) => b.localeCompare(a));

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let prevDate: string | null = null;

    const sortedAsc = [...sortedCompleted].sort((a, b) => a.localeCompare(b));
    
    sortedAsc.forEach(date => {
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diff = differenceInDays(new Date(date), new Date(prevDate));
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
      prevDate = date;
    });

    // Current streak from today backwards
    const todayStr = format(today, 'yyyy-MM-dd');
    let checkDate = todayStr;
    
    for (let i = 0; i < sessions.length; i++) {
      if (sortedCompleted.includes(checkDate)) {
        currentStreak++;
        checkDate = format(subDays(new Date(checkDate), 1), 'yyyy-MM-dd');
      } else if (checkDate !== todayStr) {
        break;
      } else {
        checkDate = format(subDays(new Date(checkDate), 1), 'yyyy-MM-dd');
      }
    }

    return { morningCompleted, eveningCompleted, dayCompleted, currentStreak, bestStreak };
  }, [sessions]);

  // Weekly completion chart
  const weeklyData = useMemo(() => {
    const weeks = eachWeekOfInterval({
      start: subDays(new Date(), 56),
      end: new Date(),
    }, { weekStartsOn: 1 });

    return weeks.map(weekStart => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekEntries = entries.filter(e => {
        const d = e.date;
        return d >= format(weekStart, 'yyyy-MM-dd') && d <= format(weekEnd, 'yyyy-MM-dd');
      });
      
      const completed = weekEntries.filter(e => e.completed_at).length;
      
      return {
        week: format(weekStart, 'dd/MM'),
        completed,
        total: 7,
        rate: Math.round((completed / 7) * 100),
      };
    });
  }, [entries]);

  // Theme usage chart
  const themeUsageData = useMemo(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const recent = entries.filter(e => e.date >= thirtyDaysAgo && e.theme_id);
    
    const counts: Record<string, number> = {};
    recent.forEach(e => {
      if (e.theme_id) {
        counts[e.theme_id] = (counts[e.theme_id] || 0) + 1;
      }
    });

    return themes
      .filter(t => counts[t.id])
      .map(t => ({ name: t.name, count: counts[t.id] }))
      .sort((a, b) => b.count - a.count);
  }, [entries, themes]);

  // Energy vs completion scatter
  const energyData = useMemo(() => {
    return entries
      .filter(e => e.energy !== null)
      .map(e => ({
        energy: e.energy,
        completed: e.completed_at ? 1 : 0,
      }));
  }, [entries]);

  // Mood frequency from journal entries (last 30 days)
  const moodData = useMemo(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const recent = journalEntries.filter(e => e.entry_date >= thirtyDaysAgo && e.mood);
    
    const counts: Record<string, number> = {};
    recent.forEach(e => {
      if (e.mood) {
        const mood = e.mood.toLowerCase().trim();
        counts[mood] = (counts[mood] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [journalEntries]);

  // Emotion frequency from journal entries (last 30 days)
  const emotionData = useMemo(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const recent = journalEntries.filter(e => e.entry_date >= thirtyDaysAgo && e.emotion);
    
    const counts: Record<string, number> = {};
    recent.forEach(e => {
      if (e.emotion) {
        const emotion = e.emotion.toLowerCase().trim();
        counts[emotion] = (counts[emotion] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [journalEntries]);

  // Correlation: Mood vs Energy (average energy per mood)
  const moodEnergyCorrelation = useMemo(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    
    // Create a map of dates to daily entries for quick lookup
    const dailyEntriesByDate = new Map<string, { energy: number | null; completed: boolean }>();
    entries.forEach(e => {
      dailyEntriesByDate.set(e.date, { 
        energy: e.energy, 
        completed: !!e.completed_at 
      });
    });

    // Group by mood and calculate average energy + completion rate
    const moodStats: Record<string, { totalEnergy: number; energyCount: number; completedCount: number; totalCount: number }> = {};
    
    journalEntries
      .filter(e => e.entry_date >= thirtyDaysAgo && e.mood)
      .forEach(je => {
        const mood = je.mood!.toLowerCase().trim();
        const dailyEntry = dailyEntriesByDate.get(je.entry_date);
        
        if (!moodStats[mood]) {
          moodStats[mood] = { totalEnergy: 0, energyCount: 0, completedCount: 0, totalCount: 0 };
        }
        
        moodStats[mood].totalCount++;
        
        if (dailyEntry) {
          if (dailyEntry.energy !== null) {
            moodStats[mood].totalEnergy += dailyEntry.energy;
            moodStats[mood].energyCount++;
          }
          if (dailyEntry.completed) {
            moodStats[mood].completedCount++;
          }
        }
      });

    return Object.entries(moodStats)
      .filter(([_, stats]) => stats.energyCount > 0)
      .map(([mood, stats]) => ({
        name: mood,
        energia: Math.round((stats.totalEnergy / stats.energyCount) * 10) / 10,
        completude: Math.round((stats.completedCount / stats.totalCount) * 100),
      }))
      .sort((a, b) => b.energia - a.energia)
      .slice(0, 8);
  }, [journalEntries, entries]);

  // Correlation: Emotion vs Energy (average energy per emotion)
  const emotionEnergyCorrelation = useMemo(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    
    const dailyEntriesByDate = new Map<string, { energy: number | null; completed: boolean }>();
    entries.forEach(e => {
      dailyEntriesByDate.set(e.date, { 
        energy: e.energy, 
        completed: !!e.completed_at 
      });
    });

    const emotionStats: Record<string, { totalEnergy: number; energyCount: number; completedCount: number; totalCount: number }> = {};
    
    journalEntries
      .filter(e => e.entry_date >= thirtyDaysAgo && e.emotion)
      .forEach(je => {
        const emotion = je.emotion!.toLowerCase().trim();
        const dailyEntry = dailyEntriesByDate.get(je.entry_date);
        
        if (!emotionStats[emotion]) {
          emotionStats[emotion] = { totalEnergy: 0, energyCount: 0, completedCount: 0, totalCount: 0 };
        }
        
        emotionStats[emotion].totalCount++;
        
        if (dailyEntry) {
          if (dailyEntry.energy !== null) {
            emotionStats[emotion].totalEnergy += dailyEntry.energy;
            emotionStats[emotion].energyCount++;
          }
          if (dailyEntry.completed) {
            emotionStats[emotion].completedCount++;
          }
        }
      });

    return Object.entries(emotionStats)
      .filter(([_, stats]) => stats.energyCount > 0)
      .map(([emotion, stats]) => ({
        name: emotion,
        energia: Math.round((stats.totalEnergy / stats.energyCount) * 10) / 10,
        completude: Math.round((stats.completedCount / stats.totalCount) * 100),
      }))
      .sort((a, b) => b.energia - a.energia)
      .slice(0, 8);
  }, [journalEntries, entries]);

  // Theme productivity (completion rate per theme)
  const themeProductivity = useMemo(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const recent = entries.filter(e => e.date >= thirtyDaysAgo && e.theme_id);
    
    const themeStats: Record<string, { completed: number; total: number; totalEnergy: number; energyCount: number }> = {};
    
    recent.forEach(e => {
      if (e.theme_id) {
        if (!themeStats[e.theme_id]) {
          themeStats[e.theme_id] = { completed: 0, total: 0, totalEnergy: 0, energyCount: 0 };
        }
        themeStats[e.theme_id].total++;
        if (e.completed_at) {
          themeStats[e.theme_id].completed++;
        }
        if (e.energy !== null) {
          themeStats[e.theme_id].totalEnergy += e.energy;
          themeStats[e.theme_id].energyCount++;
        }
      }
    });

    return Object.entries(themeStats)
      .filter(([_, stats]) => stats.total >= 2) // Need at least 2 entries for meaningful data
      .map(([themeId, stats]) => {
        const theme = themes.find(t => t.id === themeId);
        return {
          themeId,
          name: theme?.name || 'Desconhecido',
          completionRate: Math.round((stats.completed / stats.total) * 100),
          avgEnergy: stats.energyCount > 0 ? Math.round((stats.totalEnergy / stats.energyCount) * 10) / 10 : null,
          count: stats.total,
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [entries, themes]);

  // Energy by day of week
  const energyByDayOfWeek = useMemo(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const recent = entries.filter(e => e.date >= thirtyDaysAgo && e.energy !== null);
    
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayStats: Record<number, { totalEnergy: number; count: number; completedCount: number; totalCount: number }> = {};
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      dayStats[i] = { totalEnergy: 0, count: 0, completedCount: 0, totalCount: 0 };
    }
    
    entries.filter(e => e.date >= thirtyDaysAgo).forEach(e => {
      const dayOfWeek = getDay(new Date(e.date));
      dayStats[dayOfWeek].totalCount++;
      if (e.completed_at) {
        dayStats[dayOfWeek].completedCount++;
      }
      if (e.energy !== null) {
        dayStats[dayOfWeek].totalEnergy += e.energy;
        dayStats[dayOfWeek].count++;
      }
    });

    return Object.entries(dayStats)
      .filter(([_, stats]) => stats.count > 0)
      .map(([day, stats]) => ({
        day: parseInt(day),
        name: dayNames[parseInt(day)],
        avgEnergy: Math.round((stats.totalEnergy / stats.count) * 10) / 10,
        completionRate: stats.totalCount > 0 ? Math.round((stats.completedCount / stats.totalCount) * 100) : 0,
      }))
      .sort((a, b) => b.avgEnergy - a.avgEnergy);
  }, [entries]);

  // Most frequent action patterns from journal
  const actionPatterns = useMemo(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const actions = journalEntries
      .filter(e => e.entry_date >= thirtyDaysAgo && e.action)
      .map(e => e.action!.toLowerCase().trim());
    
    // Count word frequencies (simple pattern detection)
    const wordCounts: Record<string, number> = {};
    actions.forEach(action => {
      const words = action.split(/\s+/).filter(w => w.length > 4);
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    return Object.entries(wordCounts)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));
  }, [journalEntries]);

  // Derive automatic insights from the correlation data
  const autoInsights = useMemo(() => {
    const insights: Array<{
      icon: 'smile' | 'heart' | 'battery' | 'trophy' | 'calendar' | 'bookmark' | 'star' | 'trending-down' | 'clock' | 'alert' | 'moon' | 'sun' | 'activity' | 'chart';
      title: string;
      description: string;
      highlight: string;
    }> = [];

    // Most productive theme
    if (themeProductivity.length > 0) {
      const best = themeProductivity[0];
      insights.push({
        icon: 'bookmark',
        title: 'Tema mais produtivo',
        description: `Com o tema "${best.name}", você completa ${best.completionRate}% das tarefas.`,
        highlight: best.name,
      });
    }

    // Best day of week for energy
    if (energyByDayOfWeek.length > 0) {
      const bestDay = energyByDayOfWeek[0];
      insights.push({
        icon: 'calendar',
        title: 'Dia de maior energia',
        description: `${bestDay.name} é seu dia de maior energia (média ${bestDay.avgEnergy}/10).`,
        highlight: bestDay.name,
      });
    }

    // Best day for completion
    const daysByCompletion = [...energyByDayOfWeek].sort((a, b) => b.completionRate - a.completionRate);
    if (daysByCompletion.length > 0 && daysByCompletion[0].completionRate > 0) {
      const bestDay = daysByCompletion[0];
      if (bestDay.name !== energyByDayOfWeek[0]?.name) {
        insights.push({
          icon: 'star',
          title: 'Dia mais produtivo',
          description: `${bestDay.name} tem a maior taxa de completude (${bestDay.completionRate}%).`,
          highlight: bestDay.name,
        });
      }
    }

    // Best mood for completion
    const moodByCompletion = [...moodEnergyCorrelation].sort((a, b) => b.completude - a.completude);
    if (moodByCompletion.length > 0 && moodByCompletion[0].completude > 0) {
      insights.push({
        icon: 'smile',
        title: 'Melhor humor para completar',
        description: `Quando você está "${moodByCompletion[0].name}", completa ${moodByCompletion[0].completude}% das tarefas.`,
        highlight: moodByCompletion[0].name,
      });
    }

    // Highest energy mood
    if (moodEnergyCorrelation.length > 0) {
      const highestEnergy = moodEnergyCorrelation[0];
      insights.push({
        icon: 'battery',
        title: 'Humor de maior energia',
        description: `O humor "${highestEnergy.name}" está associado a energia média de ${highestEnergy.energia}/10.`,
        highlight: highestEnergy.name,
      });
    }

    // Best emotion for completion
    const emotionByCompletion = [...emotionEnergyCorrelation].sort((a, b) => b.completude - a.completude);
    if (emotionByCompletion.length > 0 && emotionByCompletion[0].completude > 0) {
      insights.push({
        icon: 'heart',
        title: 'Emoção que mais impulsiona',
        description: `A emoção "${emotionByCompletion[0].name}" tem ${emotionByCompletion[0].completude}% de taxa de completude.`,
        highlight: emotionByCompletion[0].name,
      });
    }

    // Highest energy emotion
    if (emotionEnergyCorrelation.length > 0) {
      const highestEnergy = emotionEnergyCorrelation[0];
      insights.push({
        icon: 'trophy',
        title: 'Emoção de maior energia',
        description: `Quando sente "${highestEnergy.name}", sua energia média é ${highestEnergy.energia}/10.`,
        highlight: highestEnergy.name,
      });
    }

    // Theme with highest energy
    const themeByEnergy = [...themeProductivity].filter(t => t.avgEnergy !== null).sort((a, b) => (b.avgEnergy || 0) - (a.avgEnergy || 0));
    if (themeByEnergy.length > 0 && themeByEnergy[0].name !== themeProductivity[0]?.name) {
      insights.push({
        icon: 'battery',
        title: 'Tema de maior energia',
        description: `O tema "${themeByEnergy[0].name}" eleva sua energia para ${themeByEnergy[0].avgEnergy}/10.`,
        highlight: themeByEnergy[0].name,
      });
    }

    // NEW INSIGHTS:

    // Lowest energy day (warning)
    const lowestEnergyDay = [...energyByDayOfWeek].sort((a, b) => a.avgEnergy - b.avgEnergy)[0];
    if (lowestEnergyDay && energyByDayOfWeek.length > 3) {
      const diff = energyByDayOfWeek[0].avgEnergy - lowestEnergyDay.avgEnergy;
      if (diff >= 1.5) {
        insights.push({
          icon: 'trending-down',
          title: 'Dia de menor energia',
          description: `${lowestEnergyDay.name} tende a ser seu dia mais baixo (${lowestEnergyDay.avgEnergy}/10).`,
          highlight: lowestEnergyDay.name,
        });
      }
    }

    // Weekend vs Weekday energy comparison
    const weekendDays = energyByDayOfWeek.filter(d => d.day === 0 || d.day === 6);
    const weekdayDays = energyByDayOfWeek.filter(d => d.day >= 1 && d.day <= 5);
    if (weekendDays.length > 0 && weekdayDays.length > 0) {
      const weekendAvg = weekendDays.reduce((acc, d) => acc + d.avgEnergy, 0) / weekendDays.length;
      const weekdayAvg = weekdayDays.reduce((acc, d) => acc + d.avgEnergy, 0) / weekdayDays.length;
      const diff = Math.abs(weekendAvg - weekdayAvg);
      if (diff >= 1) {
        insights.push({
          icon: weekendAvg > weekdayAvg ? 'sun' : 'moon',
          title: weekendAvg > weekdayAvg ? 'Mais energia no fim de semana' : 'Mais energia nos dias úteis',
          description: `Sua energia ${weekendAvg > weekdayAvg ? 'no fim de semana' : 'nos dias úteis'} é ${Math.round((weekendAvg > weekdayAvg ? weekendAvg : weekdayAvg) * 10) / 10}/10 vs ${Math.round((weekendAvg > weekdayAvg ? weekdayAvg : weekendAvg) * 10) / 10}/10.`,
          highlight: weekendAvg > weekdayAvg ? 'Fim de semana' : 'Dias úteis',
        });
      }
    }

    // Most consistent theme (lowest variance in completion)
    if (themeProductivity.length > 2) {
      const themesWithMultipleEntries = themeProductivity.filter(t => t.count >= 3);
      const consistentTheme = themesWithMultipleEntries.find(t => t.completionRate >= 80);
      if (consistentTheme && consistentTheme.name !== themeProductivity[0]?.name) {
        insights.push({
          icon: 'activity',
          title: 'Tema mais consistente',
          description: `"${consistentTheme.name}" mantém ${consistentTheme.completionRate}% de conclusão em ${consistentTheme.count} dias.`,
          highlight: consistentTheme.name,
        });
      }
    }

    // Energy and completion correlation
    const highEnergyEntries = entries.filter(e => e.energy !== null && e.energy >= 7);
    const lowEnergyEntries = entries.filter(e => e.energy !== null && e.energy <= 4);
    if (highEnergyEntries.length >= 5 && lowEnergyEntries.length >= 5) {
      const highEnergyCompletion = Math.round((highEnergyEntries.filter(e => e.completed_at).length / highEnergyEntries.length) * 100);
      const lowEnergyCompletion = Math.round((lowEnergyEntries.filter(e => e.completed_at).length / lowEnergyEntries.length) * 100);
      const diff = highEnergyCompletion - lowEnergyCompletion;
      if (diff >= 20) {
        insights.push({
          icon: 'chart',
          title: 'Energia impacta produtividade',
          description: `Com alta energia (7+) você completa ${highEnergyCompletion}% vs ${lowEnergyCompletion}% com baixa energia.`,
          highlight: `+${diff}%`,
        });
      }
    }

    // Least productive mood (warning)
    const worstMood = [...moodEnergyCorrelation].sort((a, b) => a.completude - b.completude)[0];
    if (worstMood && moodByCompletion.length > 2 && worstMood.completude < 50 && moodByCompletion[0].completude - worstMood.completude >= 30) {
      insights.push({
        icon: 'alert',
        title: 'Humor que reduz produtividade',
        description: `Quando está "${worstMood.name}", sua taxa de conclusão cai para ${worstMood.completude}%.`,
        highlight: worstMood.name,
      });
    }

    // Average energy trend (general energy level)
    const avgEnergy = entries.filter(e => e.energy !== null).reduce((acc, e) => acc + (e.energy || 0), 0) / entries.filter(e => e.energy !== null).length;
    if (!isNaN(avgEnergy)) {
      const roundedAvg = Math.round(avgEnergy * 10) / 10;
      if (roundedAvg >= 7) {
        insights.push({
          icon: 'sun',
          title: 'Nível de energia alto',
          description: `Sua energia média geral é ${roundedAvg}/10. Você está em boa forma!`,
          highlight: `${roundedAvg}/10`,
        });
      } else if (roundedAvg <= 4) {
        insights.push({
          icon: 'moon',
          title: 'Energia merece atenção',
          description: `Sua energia média é ${roundedAvg}/10. Considere descanso e recuperação.`,
          highlight: `${roundedAvg}/10`,
        });
      }
    }

    // Theme variety insight
    if (themeProductivity.length >= 4) {
      insights.push({
        icon: 'activity',
        title: 'Variedade de temas',
        description: `Você trabalhou com ${themeProductivity.length} temas diferentes nos últimos 30 dias.`,
        highlight: `${themeProductivity.length} temas`,
      });
    }

    // Gratitude frequency from journal
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const gratitudeEntries = journalEntries.filter(e => e.entry_date >= thirtyDaysAgo && e.gratitude && e.gratitude.trim().length > 0);
    if (gratitudeEntries.length >= 5) {
      insights.push({
        icon: 'heart',
        title: 'Prática de gratidão ativa',
        description: `Você registrou gratidão em ${gratitudeEntries.length} dias nos últimos 30 dias.`,
        highlight: `${gratitudeEntries.length} dias`,
      });
    }

    return insights;
  }, [moodEnergyCorrelation, emotionEnergyCorrelation, themeProductivity, energyByDayOfWeek, entries, journalEntries]);

  const getInsightIcon = (type: 'smile' | 'heart' | 'battery' | 'trophy' | 'calendar' | 'bookmark' | 'star' | 'trending-down' | 'clock' | 'alert' | 'moon' | 'sun' | 'activity' | 'chart') => {
    switch (type) {
      case 'smile': return <Smile className="h-6 w-6" />;
      case 'heart': return <Heart className="h-6 w-6" />;
      case 'battery': return <Battery className="h-6 w-6" />;
      case 'trophy': return <Trophy className="h-6 w-6" />;
      case 'calendar': return <Calendar className="h-6 w-6" />;
      case 'bookmark': return <Bookmark className="h-6 w-6" />;
      case 'star': return <Star className="h-6 w-6" />;
      case 'trending-down': return <TrendingDown className="h-6 w-6" />;
      case 'clock': return <Clock className="h-6 w-6" />;
      case 'alert': return <AlertTriangle className="h-6 w-6" />;
      case 'moon': return <Moon className="h-6 w-6" />;
      case 'sun': return <Sun className="h-6 w-6" />;
      case 'activity': return <Activity className="h-6 w-6" />;
      case 'chart': return <BarChart3 className="h-6 w-6" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold">Insights</h2>

        {/* KPIs - Updated */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Sun className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold text-foreground">{sessionStats.morningCompleted}/30</p>
              <p className="text-xs text-muted-foreground">Manhãs concluídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Moon className="h-6 w-6 mx-auto mb-2 text-indigo-500" />
              <p className="text-2xl font-bold text-foreground">{sessionStats.eveningCompleted}/30</p>
              <p className="text-xs text-muted-foreground">Noites concluídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">{sessionStats.dayCompleted}/30</p>
              <p className="text-xs text-muted-foreground">Dias completos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-foreground">{sessionStats.currentStreak} / {sessionStats.bestStreak}</p>
              <p className="text-xs text-muted-foreground">Streak atual / melhor</p>
            </CardContent>
          </Card>
        </div>

        {/* Rules Engine Advice Cards */}
        <InsightsAdviceCards 
          entries={entries} 
          sessions={sessions} 
          journalEntries={journalEntries} 
        />

        {/* Auto Insights Cards */}
        {autoInsights.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Descobertas Automáticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {autoInsights.map((insight, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-background border"
                  >
                    <div className="text-primary mt-0.5">
                      {getInsightIcon(insight.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{insight.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Baseado nos últimos 30 dias de registros
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contribution Graph (GitHub-style) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Grid className="h-5 w-5" />
              Consistência (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContributionGraph sessions={sessions} days={30} />
          </CardContent>
        </Card>

        {/* Weekly completion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completude por Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Theme usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temas Usados (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={themeUsageData} layout="vertical">
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Energy by day of week */}
        {energyByDayOfWeek.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Energia por Dia da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart 
                  data={[...energyByDayOfWeek].sort((a, b) => {
                    // Sort by day order (Sunday=0 to Saturday=6)
                    const order = [1, 2, 3, 4, 5, 6, 0]; // Start with Monday
                    return order.indexOf(a.day) - order.indexOf(b.day);
                  })}
                >
                  <XAxis dataKey="name" fontSize={12} tickFormatter={(v) => v.slice(0, 3)} />
                  <YAxis fontSize={12} domain={[0, 10]} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'avgEnergy' ? `${value}/10` : `${value}%`,
                      name === 'avgEnergy' ? 'Energia média' : 'Completude'
                    ]}
                  />
                  <Bar dataKey="avgEnergy" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="avgEnergy" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Média de energia por dia da semana (últimos 30 dias)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Mood frequency */}
        {moodData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smile className="h-5 w-5" />
                Humores Frequentes (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(150, moodData.length * 32)}>
                <BarChart data={moodData} layout="vertical">
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Emotion frequency */}
        {emotionData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Emoções Frequentes (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(150, emotionData.length * 32)}>
                <BarChart data={emotionData} layout="vertical">
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Mood vs Energy/Completion correlation */}
        {moodEnergyCorrelation.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Humor × Energia & Completude
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(180, moodEnergyCorrelation.length * 36)}>
                <BarChart data={moodEnergyCorrelation} layout="vertical">
                  <XAxis type="number" fontSize={12} domain={[0, 10]} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'energia' ? `${value}/10` : `${value}%`,
                      name === 'energia' ? 'Energia média' : 'Taxa de completude'
                    ]}
                  />
                  <Bar dataKey="energia" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} name="energia" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Energia média por humor (últimos 30 dias)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Emotion vs Energy/Completion correlation */}
        {emotionEnergyCorrelation.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Emoção × Energia & Completude
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(180, emotionEnergyCorrelation.length * 36)}>
                <BarChart data={emotionEnergyCorrelation} layout="vertical">
                  <XAxis type="number" fontSize={12} domain={[0, 10]} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'energia' ? `${value}/10` : `${value}%`,
                      name === 'energia' ? 'Energia média' : 'Taxa de completude'
                    ]}
                  />
                  <Bar dataKey="energia" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} name="energia" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Energia média por emoção (últimos 30 dias)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Completude</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
