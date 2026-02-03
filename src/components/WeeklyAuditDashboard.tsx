/**
 * Weekly Audit Dashboard Component
 * Sprint: Weekly Session Refactor - Dashboard First
 * 
 * Read-only summary cards showing weekly aggregations:
 * - Execution Rate
 * - Top Saboteur  
 * - Energy Trend
 * - Gratitude Cloud
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, 
  AlertTriangle, 
  Zap, 
  Heart,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { WeeklyStats } from '@/hooks/useWeeklyStats';
import { cn } from '@/lib/utils';

interface WeeklyAuditDashboardProps {
  stats: WeeklyStats | undefined;
  isLoading: boolean;
}

const saboteurLabels: Record<string, string> = {
  'Procrastination': 'Procrastinação',
  'Fatigue': 'Fadiga',
  'Planning': 'Planejamento',
  'External': 'Externo',
  'Forgot': 'Esqueci',
};

const categoryLabels: Record<string, string> = {
  'Self': 'Eu',
  'Relationships': 'Relações',
  'Work': 'Trabalho',
  'Nature/God': 'Natureza/Deus',
  'Circumstance': 'Circunstância',
};

export function WeeklyAuditDashboard({ stats, isLoading }: WeeklyAuditDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="pt-6 text-center text-muted-foreground">
          Nenhum dado disponível para esta semana
        </CardContent>
      </Card>
    );
  }

  const getExecutionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400';
    if (rate >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-destructive';
  };

  const getEnergyTrendIcon = () => {
    if (stats.energyDelta == null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (stats.energyDelta > 0) return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    if (stats.energyDelta < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Execution Rate */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Taxa de Execução
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className={cn("text-2xl font-bold", getExecutionColor(stats.executionRate))}>
            {stats.executionRate}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.completedDays}/{stats.totalDays} dias
          </p>
        </CardContent>
      </Card>

      {/* Top Saboteur */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Top Sabotador
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {stats.topSaboteur ? (
            <>
              <div className="text-lg font-semibold text-destructive">
                {saboteurLabels[stats.topSaboteur] || stats.topSaboteur}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.saboteurCount}x esta semana
              </p>
            </>
          ) : (
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              Nenhum
            </div>
          )}
        </CardContent>
      </Card>

      {/* Energy Trend */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Energia Média
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              {stats.avgEnergyThisWeek ?? '-'}
            </span>
            {stats.energyDelta != null && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  stats.energyDelta > 0 && "border-green-600 text-green-600 dark:border-green-400 dark:text-green-400",
                  stats.energyDelta < 0 && "border-destructive text-destructive"
                )}
              >
                {getEnergyTrendIcon()}
                {stats.energyDelta > 0 ? '+' : ''}{stats.energyDelta}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            vs {stats.avgEnergyLastWeek ?? '-'} sem. passada
          </p>
        </CardContent>
      </Card>

      {/* Gratitude Cloud */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            Fontes de Gratidão
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {stats.topGratitudeCategories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {stats.topGratitudeCategories.map(({ category, count }, idx) => (
                <Badge 
                  key={category} 
                  variant={idx === 0 ? "default" : "outline"}
                  className="text-xs"
                >
                  {categoryLabels[category] || category} ({count})
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum registro
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
