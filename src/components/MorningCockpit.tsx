import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Quote, Eye, BookOpen, Target, Sparkles, Play, Headphones, Heart } from 'lucide-react';
import { DailySession } from '@/hooks/useDailySession';
import { calculateMorningProgress } from '@/lib/sessionProgress';

interface MorningCockpitProps {
  session: DailySession | null;
  hasVisualization: boolean;
  hasJournalEntry: boolean;
  criticalAction?: string;
  onStartVisualization: () => void;
  onPlayVisualization: () => void;
  onGoToJournal: () => void;
  isLoading?: boolean;
}

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  optional?: boolean;
}

export function MorningCockpit({
  session,
  hasVisualization,
  hasJournalEntry,
  criticalAction,
  onStartVisualization,
  onPlayVisualization,
  onGoToJournal,
  isLoading,
}: MorningCockpitProps) {
  // Calculate progress using new structured fields
  const morningProgress = useMemo(() => 
    calculateMorningProgress(session, { criticalAction }),
    [session, criticalAction]
  );

  const steps: Step[] = useMemo(() => [
    {
      id: 'quote',
      label: 'Quote do dia (li e entendi)',
      icon: <Quote className="h-4 w-4" />,
      completed: morningProgress.steps.quoteAbsorbed,
    },
    {
      id: 'visualization',
      label: 'Visualização + Clareza',
      icon: <Eye className="h-4 w-4" />,
      completed: morningProgress.steps.hasClarityLevel,
    },
    {
      id: 'intention',
      label: 'Intenção Principal',
      icon: <BookOpen className="h-4 w-4" />,
      completed: morningProgress.steps.hasIntention,
    },
    {
      id: 'gratitude',
      label: 'Gratidão (categoria)',
      icon: <Heart className="h-4 w-4" />,
      completed: morningProgress.steps.hasGratitudeCategory,
    },
    {
      id: 'action',
      label: 'Ação crítica + categoria',
      icon: <Target className="h-4 w-4" />,
      completed: morningProgress.steps.hasCriticalAction && morningProgress.steps.hasActionCategory,
    },
  ], [morningProgress]);

  const allCompleted = morningProgress.isComplete;

  // Determine main action button state
  const getMainAction = () => {
    if (allCompleted) {
      return { label: 'Manhã concluída ✓', disabled: true, action: () => {}, icon: <CheckCircle className="h-4 w-4" /> };
    }
    
    if (!hasVisualization) {
      return { label: 'Começar agora', disabled: false, action: onStartVisualization, icon: <Play className="h-4 w-4" /> };
    }
    
    if (!morningProgress.steps.hasClarityLevel) {
      return { label: 'Iniciar meditação', disabled: false, action: onPlayVisualization, icon: <Headphones className="h-4 w-4" /> };
    }
    
    if (!morningProgress.steps.hasIntention) {
      return { label: 'Definir intenção', disabled: false, action: onGoToJournal, icon: <BookOpen className="h-4 w-4" /> };
    }

    // Still has missing fields
    return { label: 'Completar sessão', disabled: false, action: onGoToJournal, icon: <Target className="h-4 w-4" /> };
  };

  const mainAction = getMainAction();

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sessão da Manhã
          </CardTitle>
          {allCompleted && (
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Concluída
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{morningProgress.percentage}%</span>
          </div>
          <Progress value={morningProgress.percentage} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                step.completed 
                  ? 'bg-primary/10 text-foreground' 
                  : 'bg-muted/30 text-muted-foreground'
              }`}
            >
              <div className={step.completed ? 'text-primary' : ''}>
                {step.completed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-1">
                {step.icon}
                <span className="text-sm">{step.label}</span>
                {step.optional && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    opcional
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  );
}
