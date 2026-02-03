import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Sun, Moon, Zap, Quote, Eye, BookOpen, ArrowRight } from 'lucide-react';
import { DailySession } from '@/hooks/useDailySession';
import { Theme } from '@/lib/database.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface DaySummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: DailySession | null;
  date: Date;
  theme?: Theme | null;
  quotText?: string | null;
  visualizationTitle?: string | null;
  journalInsight?: string | null;
  journalAction?: string | null;
}

export function DaySummaryDrawer({
  open,
  onOpenChange,
  session,
  date,
  theme,
  quotText,
  visualizationTitle,
  journalInsight,
  journalAction,
}: DaySummaryDrawerProps) {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    if (session?.day_completed) {
      return (
        <Badge className="bg-primary/20 text-primary">
          <CheckCircle className="h-3 w-3 mr-1" />
          Dia Concluído
        </Badge>
      );
    }
    if (session?.morning_completed && session?.evening_completed) {
      return (
        <Badge className="bg-primary/20 text-primary">
          <CheckCircle className="h-3 w-3 mr-1" />
          Dia Concluído
        </Badge>
      );
    }
    if (session?.morning_completed) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
          <Sun className="h-3 w-3 mr-1" />
          Manhã Concluída
        </Badge>
      );
    }
    if (session?.evening_completed) {
      return (
        <Badge className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-400">
          <Moon className="h-3 w-3 mr-1" />
          Noite Concluída
        </Badge>
      );
    }
    if (session) {
      return (
        <Badge variant="outline">
          <Circle className="h-3 w-3 mr-1" />
          Registrado
        </Badge>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>

          {/* Theme */}
          {theme && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tema do dia</p>
              <p className="font-medium">{theme.name}</p>
            </div>
          )}

          {/* Quote */}
          {quotText && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Quote className="h-3 w-3" />
                Quote
              </p>
              <p className="text-sm italic">"{quotText}"</p>
            </div>
          )}

          {/* Visualization */}
          {visualizationTitle && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Visualização
              </p>
              <p className="text-sm">{visualizationTitle}</p>
            </div>
          )}

          {/* Energy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sun className="h-3 w-3" />
                Energia manhã
              </p>
              <p className="font-medium">
                {session?.morning_energy != null ? `${session.morning_energy}/10` : '-'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Moon className="h-3 w-3" />
                Energia noite
              </p>
              <p className="font-medium">
                {session?.evening_energy != null ? `${session.evening_energy}/10` : '-'}
              </p>
            </div>
          </div>

          {/* Journal preview */}
          {(journalInsight || journalAction) && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Diário
              </p>
              {journalInsight && (
                <p className="text-sm"><span className="text-muted-foreground">Insight:</span> {journalInsight}</p>
              )}
              {journalAction && (
                <p className="text-sm"><span className="text-muted-foreground">Ação:</span> {journalAction}</p>
              )}
            </div>
          )}

          {/* Session steps status */}
          {session && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                {session.morning_meditation_completed ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Meditação</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {session.morning_journal_completed ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Diário</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {session.morning_action_completed ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Ação crítica</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {session.evening_checkout_completed ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Check-out</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => {
                onOpenChange(false);
                navigate('/today');
              }}
            >
              <Sun className="h-4 w-4" />
              Ir para Manhã
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => {
                onOpenChange(false);
                navigate('/night');
              }}
            >
              <Moon className="h-4 w-4" />
              Ir para Noite
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
