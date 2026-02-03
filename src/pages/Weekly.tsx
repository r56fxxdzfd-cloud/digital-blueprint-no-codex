/**
 * Weekly Page - Refactored
 * Sprint: Weekly Session Refactor - Dashboard First
 * 
 * Structure:
 * A. Weekly Audit (Read-only dashboard)
 * B. Strategic Decisions (Start/Stop/Continue)
 * C. Next Week's Setup
 */
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, ChevronLeft, ChevronRight, Sparkles, Loader2, Play, Square, ArrowRight, Target, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWeeklyReview } from '@/hooks/useWeeklyReview';
import { useWeeklyStats } from '@/hooks/useWeeklyStats';
import { useThemes } from '@/hooks/useThemes';
import { WeeklyAuditDashboard } from '@/components/WeeklyAuditDashboard';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Weekly() {
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { review, saveReview, isLoading } = useWeeklyReview(weekStart);
  const { data: stats, isLoading: statsLoading } = useWeeklyStats(weekStart);
  const { activeThemes, themes } = useThemes();

  // Section C: Next Week's Setup
  const [nextWeekGoal, setNextWeekGoal] = useState('');
  const [nextWeekIdentity, setNextWeekIdentity] = useState('');
  
  // Section B: Strategic Decisions (Start/Stop/Continue)
  const [strategyStart, setStrategyStart] = useState('');
  const [strategyStop, setStrategyStop] = useState('');
  const [strategyContinue, setStrategyContinue] = useState('');
  
  // Legacy fields (kept for backwards compat)
  const [score, setScore] = useState(5);
  const [themeId, setThemeId] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (review) {
      setThemeId(review.theme_id || '');
      setScore(review.score_0_10 ?? 5);
      // New fields
      setStrategyStart(review.strategy_start || '');
      setStrategyStop(review.strategy_stop || '');
      setStrategyContinue(review.strategy_continue || '');
      setNextWeekGoal(review.next_week_goal || '');
      setNextWeekIdentity(review.next_week_identity || '');
    } else {
      setThemeId('');
      setScore(5);
      setStrategyStart('');
      setStrategyStop('');
      setStrategyContinue('');
      setNextWeekGoal('');
      setNextWeekIdentity('');
    }
  }, [review]);

  const handleSave = async () => {
    await saveReview({
      theme_id: themeId || null,
      score_0_10: score,
      strategy_start: strategyStart || null,
      strategy_stop: strategyStop || null,
      strategy_continue: strategyContinue || null,
      next_week_goal: nextWeekGoal || null,
      next_week_identity: nextWeekIdentity || null,
    });
    
    toast({ title: 'Revisão salva!' });
  };

  const handleCopyWhatsApp = () => {
    const themeName = themes.find(t => t.id === themeId)?.name || '-';
    const text = `📊 *Blueprint Digital - Revisão Semanal*

📅 Semana: ${format(weekStart, 'dd/MM/yyyy')}
🎯 Tema: ${themeName}

📈 *Métricas*
• Execução: ${stats?.executionRate ?? '-'}%
• Sabotador: ${stats?.topSaboteur || 'Nenhum'}
• Energia média: ${stats?.avgEnergyThisWeek ?? '-'}/10

🎯 *Decisões Estratégicas*
▶️ Começar: ${strategyStart || '-'}
⏹️ Parar: ${strategyStop || '-'}
➡️ Continuar: ${strategyContinue || '-'}

🚀 *Próxima Semana*
🎯 Meta: ${nextWeekGoal || '-'}
👤 Identidade: ${nextWeekIdentity || '-'}

⭐ Nota: ${score}/10`;

    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Revisão copiada para o WhatsApp' });
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ 
          title: 'Erro', 
          description: 'Você precisa estar logado para usar esta funcionalidade.',
          variant: 'destructive'
        });
        return;
      }

      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-week`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ weekStart: weekStartStr }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast({ 
          title: 'Erro', 
          description: data.message || data.error || 'Não foi possível analisar a semana.',
          variant: 'destructive'
        });
        return;
      }

      // Map AI response to Start/Stop/Continue
      if (data.selfDeceptionPattern) {
        setStrategyStop(data.selfDeceptionPattern);
      }
      if (data.wins) {
        setStrategyContinue(data.wins);
      }
      if (data.tacticalAdjustment) {
        setStrategyStart(data.tacticalAdjustment);
      }

      toast({ 
        title: 'Análise concluída!', 
        description: `${data.entriesAnalyzed} registros analisados.`
      });
    } catch (error) {
      console.error('Error analyzing week:', error);
      toast({ 
        title: 'Erro', 
        description: 'Falha ao conectar com o serviço de AI.',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            Semana de {format(weekStart, "d 'de' MMMM", { locale: ptBR })}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Section A: Weekly Audit (Read-Only Dashboard) */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Resumo da Semana
          </h3>
          <WeeklyAuditDashboard stats={stats} isLoading={statsLoading} />
        </div>

        {/* AI Analysis Button */}
        <Button 
          variant="outline" 
          className="w-full border-primary/30 hover:bg-primary/10"
          onClick={handleAnalyzeWithAI}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analisando semana...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analisar com AI
            </>
          )}
        </Button>

        {/* Section B: Strategic Decisions (Start/Stop/Continue) */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Decisões Estratégicas
          </h3>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Start */}
              <div className="space-y-2">
                <Label htmlFor="strategy-start" className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Começar (O que iniciar?)
                </Label>
                <Textarea
                  id="strategy-start"
                  placeholder="Nova tática para teste..."
                  value={strategyStart}
                  onChange={(e) => setStrategyStart(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Stop */}
              <div className="space-y-2">
                <Label htmlFor="strategy-stop" className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-destructive" />
                  Parar (O que eliminar?)
                </Label>
                <Textarea
                  id="strategy-stop"
                  placeholder="O que drenou energia/tempo..."
                  value={strategyStop}
                  onChange={(e) => setStrategyStop(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Continue */}
              <div className="space-y-2">
                <Label htmlFor="strategy-continue" className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Continuar (O que manter?)
                </Label>
                <Textarea
                  id="strategy-continue"
                  placeholder="O que funcionou bem..."
                  value={strategyContinue}
                  onChange={(e) => setStrategyContinue(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section C: Next Week's Setup */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Próxima Semana
          </h3>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Theme */}
              <div className="space-y-2">
                <Label>Tema da Semana</Label>
                <Select value={themeId} onValueChange={setThemeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tema principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeThemes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Main Goal */}
              <div className="space-y-2">
                <Label htmlFor="next-week-goal" className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Meta Principal
                </Label>
                <Input
                  id="next-week-goal"
                  placeholder="O resultado mais importante para próxima semana..."
                  value={nextWeekGoal}
                  onChange={(e) => setNextWeekGoal(e.target.value)}
                />
              </div>

              {/* Identity */}
              <div className="space-y-2">
                <Label htmlFor="next-week-identity" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Identidade
                </Label>
                <Input
                  id="next-week-identity"
                  placeholder="Quem você precisa ser para atingir essa meta?"
                  value={nextWeekIdentity}
                  onChange={(e) => setNextWeekIdentity(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Week Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex justify-between">
              <span>Nota da Semana</span>
              <span className="text-primary">{score}/10</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Slider value={[score]} onValueChange={([v]) => setScore(v)} max={10} min={0} step={1} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">Salvar</Button>
          <Button variant="outline" onClick={handleCopyWhatsApp}>
            <Copy className="h-4 w-4 mr-2" />WhatsApp
          </Button>
        </div>
      </div>
    </Layout>
  );
}
