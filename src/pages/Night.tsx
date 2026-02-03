/**
 * Night Page - Evening Checkout (Audit View)
 * Sprint: Data Input Refactor - Audit/Structured Data
 * 
 * Updated structured inputs:
 * - Energy delta display showing morning vs evening change
 * - Mood Meter Tiles (Yale zones: Red, Yellow, Blue, Green)
 * - Failure Reason dropdown when action not completed
 * - Daily Win & Daily Loss fields replace evidence
 * - Presence Score slider (0-100%) replaces auto-pilot
 */
import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Copy, Moon, AlertCircle, CheckCircle, Calendar, Sun, Target, TrendingUp, TrendingDown, Trophy, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDailyEntry } from '@/hooks/useDailyEntry';
import { useDailySession } from '@/hooks/useDailySession';
import { useThemes } from '@/hooks/useThemes';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoodMeterTiles, EmotionalZone } from '@/components/MoodMeterTiles';
import { PresenceSlider } from '@/components/PresenceSlider';
import { FailureReasonSelect, FailureReason } from '@/components/FailureReasonSelect';
import { EnergyDeltaDisplay } from '@/components/EnergyDeltaDisplay';
import { GratitudeCard } from '@/components/GratitudeCard';
import { calculateNightProgress } from '@/lib/sessionProgress';

export default function Night() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { entry, updateEntry, isLoading } = useDailyEntry();
  const { session, updateSession, completeEveningCheckout } = useDailySession();
  const { themes } = useThemes();

  // Legacy fields (kept for backwards compatibility)
  const [evidence, setEvidence] = useState('');
  const [autopilot, setAutopilot] = useState('');
  const [tomorrowAdjustment, setTomorrowAdjustment] = useState('');
  const [actionDone, setActionDone] = useState(false);
  const [eveningEnergy, setEveningEnergy] = useState<number>(5);
  const [validationError, setValidationError] = useState('');
  const [obstacle, setObstacle] = useState('');
  const [ruleForTomorrow, setRuleForTomorrow] = useState('');
  
  // Sprint: Data Input Refactor - new structured fields
  const [emotionalZone, setEmotionalZone] = useState<EmotionalZone | null>(null);
  const [presenceScore, setPresenceScore] = useState<number | null>(null);
  const [failureReason, setFailureReason] = useState<FailureReason | null>(null);
  const [dailyWin, setDailyWin] = useState('');
  const [dailyLoss, setDailyLoss] = useState('');
  // Sprint: Gratitude Section
  const [nightGratitudeText, setNightGratitudeText] = useState('');

  // Initialize from entry
  useEffect(() => {
    if (entry) {
      setEvidence(entry.evidence || '');
      setAutopilot(entry.autopilot || '');
      setTomorrowAdjustment(entry.tomorrow_adjustment || '');
      setActionDone(entry.action_done);
    }
  }, [entry]);

  // Initialize from session
  useEffect(() => {
    if (session) {
      if (session.evening_energy != null) {
        setEveningEnergy(session.evening_energy);
      }
      setObstacle(session.obstacle || '');
      setRuleForTomorrow(session.rule_for_tomorrow || '');
      setEmotionalZone(session.emotional_zone as EmotionalZone | null);
      setPresenceScore(session.presence_score ?? null);
      setFailureReason(session.failure_reason as FailureReason | null);
      setDailyWin(session.daily_win || '');
      setDailyLoss(session.daily_loss || '');
      setActionDone(session.critical_action_completed ?? entry?.action_done ?? false);
      // Sprint: Gratitude Section
      setNightGratitudeText(session.night_gratitude_text || '');
    }
  }, [session, entry?.action_done]);

  const getThemeName = (themeId: string | null) => {
    if (!themeId) return '-';
    return themes.find(t => t.id === themeId)?.name || '-';
  };

  // Calculate night progress for validation
  const nightProgress = useMemo(() => 
    calculateNightProgress(session, {
      eveningEnergy,
      emotionalZone,
      presenceScore,
      actionDone,
      failureReason,
      dailyWin,
      dailyLoss,
      nightGratitudeText,
    }),
    [session, eveningEnergy, emotionalZone, presenceScore, actionDone, failureReason, dailyWin, dailyLoss, nightGratitudeText]
  );

  const handleSave = async () => {
    if (!entry) return;
    
    await updateEntry.mutateAsync({
      evidence: evidence || null,
      autopilot: autopilot || null,
      tomorrow_adjustment: tomorrowAdjustment || null,
      action_done: actionDone,
    });

    // Save session fields
    if (session) {
      await updateSession.mutateAsync({
        evening_energy: eveningEnergy,
        obstacle: obstacle || null,
        rule_for_tomorrow: ruleForTomorrow || null,
        emotional_zone: emotionalZone,
        presence_score: presenceScore,
        failure_reason: failureReason,
        daily_win: dailyWin || null,
        daily_loss: dailyLoss || null,
        critical_action_completed: actionDone,
        // Sprint: Gratitude Section
        night_gratitude_text: nightGratitudeText || null,
      });
    }
    
    toast({ title: 'Salvo!', description: 'Check-out atualizado' });
  };

  const handleFinalize = async () => {
    if (!entry) return;
    
    // Use the calculated progress for validation
    if (!nightProgress.isComplete) {
      setValidationError(nightProgress.missingFields[0] || 'Preencha todos os campos obrigatórios');
      return;
    }

    setValidationError('');
    
    // Update daily entry (legacy)
    await updateEntry.mutateAsync({
      evidence: evidence || dailyWin || null, // fallback to dailyWin
      autopilot: autopilot || null,
      tomorrow_adjustment: tomorrowAdjustment || null,
      action_done: actionDone,
      completed_at: new Date().toISOString(),
    });
    
    // Complete evening session with all structured data
    await updateSession.mutateAsync({
      evening_checkout_completed: true,
      evening_energy: eveningEnergy,
      obstacle: obstacle || null,
      rule_for_tomorrow: ruleForTomorrow || null,
      emotional_zone: emotionalZone,
      presence_score: presenceScore,
      failure_reason: failureReason,
      daily_win: dailyWin || null,
      daily_loss: dailyLoss || null,
      critical_action_completed: actionDone,
      // Sprint: Gratitude Section
      night_gratitude_text: nightGratitudeText || null,
    });
    
    toast({ title: 'Dia finalizado!', description: 'Parabéns por completar mais um dia' });
  };

  const handleCopyWhatsApp = () => {
    if (!session?.day_completed) {
      toast({ 
        title: 'Finalize o dia primeiro', 
        description: 'Complete o check-out para compartilhar',
        variant: 'destructive' 
      });
      return;
    }

    const themeName = getThemeName(entry?.theme_id || null);
    const delta = session?.morning_energy != null ? eveningEnergy - session.morning_energy : null;
    const deltaStr = delta != null ? (delta >= 0 ? `+${delta}` : String(delta)) : '-';
    
    const zoneEmojis = { Red: '🔴', Yellow: '🟡', Blue: '🔵', Green: '🟢' };
    const zoneEmoji = emotionalZone ? zoneEmojis[emotionalZone] : '⚪';
    
    const text = `🌙 *Blueprint Digital - Check-out ${format(new Date(), "dd/MM/yyyy")}*

🎯 Tema: ${themeName}
⚡ Energia: ${session?.morning_energy ?? '-'} → ${eveningEnergy} (${deltaStr})
${zoneEmoji} Zona emocional: ${emotionalZone || '-'}
🎯 Presença: ${presenceScore ?? '-'}%
✅ Ação crítica: ${actionDone ? 'Feita' : 'Não feita'}
${!actionDone ? `❌ Motivo: ${failureReason || '-'}\n` : ''}
🏆 Vitória: ${dailyWin || '-'}
💔 Perda: ${dailyLoss || '-'}
📅 Regra amanhã: ${ruleForTomorrow || '-'}`;

    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Fechamento copiado para o WhatsApp' });
  };

  if (!entry && !isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Nenhuma entrada para hoje. Comece pela página Manhã.
              </p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => navigate('/today')}>
                  <Sun className="h-4 w-4 mr-2" />
                  Ir para Manhã
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Moon className="h-6 w-6 text-primary" />
            Check-out
          </h2>
          {session?.day_completed && (
            <Badge className="bg-primary/20 text-primary">
              <CheckCircle className="h-3 w-3 mr-1" />
              Dia Concluído
            </Badge>
          )}
        </div>

        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {/* Morning Summary Card */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Sun className="h-4 w-4" />
              Resumo da Manhã
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Tema:</span>{' '}
                <span className="font-medium">{getThemeName(entry?.theme_id || null)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Energia manhã:</span>{' '}
                <span className="font-medium">{session?.morning_energy ?? '-'}/10</span>
              </div>
            </div>
            
            {(entry?.identity || entry?.critical_action) && (
              <div className="pt-2 border-t border-border/50 space-y-2">
                {entry?.identity && (
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground">Identidade:</span>
                      <p className="text-sm font-medium">{entry.identity}</p>
                    </div>
                  </div>
                )}
                {entry?.critical_action && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground">Ação crítica:</span>
                      <p className="text-sm font-medium">{entry.critical_action}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {session?.morning_completed && (
              <Badge variant="outline" className="text-xs">
                <Sun className="h-3 w-3 mr-1" />
                Manhã concluída
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Critical Action Review */}
        {entry?.critical_action && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Você fez a ação?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm bg-muted/50 p-3 rounded-lg">
                "{entry.critical_action}"
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant={actionDone ? "default" : "outline"}
                  onClick={() => setActionDone(true)}
                  className="flex-1 gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Sim
                </Button>
                <Button
                  variant={!actionDone ? "destructive" : "outline"}
                  onClick={() => setActionDone(false)}
                  className="flex-1 gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Não
                </Button>
              </div>

              {/* Failure Reason - shown when action not done */}
              {!actionDone && (
                <div className="space-y-2 animate-fade-in">
                  <Label>Qual foi o sabotador real?</Label>
                  <FailureReasonSelect
                    value={failureReason}
                    onChange={setFailureReason}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Evening Energy with Delta */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Energia agora</span>
              <div className="flex items-center gap-3">
                <EnergyDeltaDisplay 
                  morningEnergy={session?.morning_energy ?? null}
                  eveningEnergy={eveningEnergy}
                />
                <span className="text-primary font-bold">{eveningEnergy}/10</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Slider
              value={[eveningEnergy]}
              onValueChange={([v]) => setEveningEnergy(v)}
              max={10}
              min={0}
              step={1}
              className="py-4"
            />
          </CardContent>
        </Card>

        {/* Mood Meter Tiles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Zona Emocional</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodMeterTiles
              value={emotionalZone}
              onChange={setEmotionalZone}
            />
          </CardContent>
        </Card>

        {/* Presence Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Nível de Presença</CardTitle>
          </CardHeader>
          <CardContent>
            <PresenceSlider
              value={presenceScore}
              onChange={setPresenceScore}
            />
          </CardContent>
        </Card>

        {/* Daily Win & Loss */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Vitórias e Perdas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="daily-win" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                Vitória do Dia
              </Label>
              <Input
                id="daily-win"
                placeholder="O que deu certo hoje?"
                value={dailyWin}
                onChange={(e) => setDailyWin(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="daily-loss" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Onde Falhei
              </Label>
              <Input
                id="daily-loss"
                placeholder="O que deu errado? (opcional)"
                value={dailyLoss}
                onChange={(e) => setDailyLoss(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rule for Tomorrow */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule-tomorrow">
                Regra para amanhã
                <span className="ml-2 text-xs text-muted-foreground">(Se X, então Y)</span>
              </Label>
              <Input
                id="rule-tomorrow"
                placeholder="Se [situação], então [ação específica]"
                value={ruleForTomorrow}
                onChange={(e) => setRuleForTomorrow(e.target.value)}
                maxLength={160}
              />
            </div>
          </CardContent>
        </Card>

        {/* Night Gratitude - Sprint: Gratitude Section */}
        <GratitudeCard
          variant="night"
          text={nightGratitudeText}
          onTextChange={async (val) => {
            setNightGratitudeText(val);
            if (session) {
              await updateSession.mutateAsync({ night_gratitude_text: val || null });
            }
          }}
        />

        {/* Night Progress Indicator */}
        <Card className="border-muted">
          <CardContent className="pt-4 pb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso do Check-out</span>
              <span className="font-medium">{nightProgress.percentage}%</span>
            </div>
            <Progress value={nightProgress.percentage} className="h-2" />
            {!nightProgress.isComplete && nightProgress.missingFields.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Pendente: {nightProgress.missingFields.slice(0, 2).join(', ')}
                {nightProgress.missingFields.length > 2 && ` (+${nightProgress.missingFields.length - 2})`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSave}>
            Salvar
          </Button>
          <Button 
            onClick={handleFinalize} 
            className="flex-1"
            disabled={!!session?.day_completed || !nightProgress.isComplete}
          >
            {session?.day_completed 
              ? 'Dia Finalizado ✓' 
              : nightProgress.isComplete 
                ? 'Finalizar Dia' 
                : `Finalizar (${nightProgress.percentage}%)`}
          </Button>
        </div>

        {/* Post-completion actions */}
        {session?.day_completed && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Parabéns! Seu dia foi concluído com sucesso.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleCopyWhatsApp}>
                  <Copy className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={() => navigate('/calendar')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Calendário
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
