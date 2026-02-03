import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sun, Target, User } from 'lucide-react';
import { DailyEntry } from '@/lib/database.types';

interface MorningCommitmentCardProps {
  entry: DailyEntry | null;
  actionDone: boolean;
  onActionDoneChange: (done: boolean) => void;
  obstacle: string;
  onObstacleChange: (value: string) => void;
}

export function MorningCommitmentCard({
  entry,
  actionDone,
  onActionDoneChange,
  obstacle,
  onObstacleChange,
}: MorningCommitmentCardProps) {
  const hasMorningCommitment = entry?.identity || entry?.critical_action;

  if (!hasMorningCommitment) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          Compromisso da Manhã
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Identity */}
        {entry?.identity && (
          <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
            <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <Label className="text-xs text-muted-foreground">Identidade</Label>
              <p className="text-sm font-medium">{entry.identity}</p>
            </div>
          </div>
        )}

        {/* Critical Action */}
        {entry?.critical_action && (
          <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
            <Target className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <Label className="text-xs text-muted-foreground">Ação Crítica</Label>
              <p className="text-sm font-medium">{entry.critical_action}</p>
            </div>
          </div>
        )}

        {/* Action Done Checkbox */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            <Checkbox
              id="action-completed"
              checked={actionDone}
              onCheckedChange={(checked) => onActionDoneChange(checked === true)}
            />
            <Label htmlFor="action-completed" className="text-sm font-medium cursor-pointer">
              Você completou a Ação Crítica?
            </Label>
          </div>

          {/* Conditional obstacle input */}
          {!actionDone && (
            <div className="mt-3 space-y-2 animate-fade-in">
              <Label htmlFor="obstacle" className="text-sm text-muted-foreground">
                Qual foi o real obstáculo?
              </Label>
              <Input
                id="obstacle"
                placeholder="Descreva o que impediu você de completar..."
                value={obstacle}
                onChange={(e) => onObstacleChange(e.target.value)}
                className="bg-background"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
