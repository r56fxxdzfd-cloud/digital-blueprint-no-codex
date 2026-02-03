/**
 * Micro Journal Component
 * Sprint: Core Habit Loop + SOS + Chips + Focus Mode + Dynamic Prompts
 * 
 * Updated to use mood/emotion chip selectors instead of text inputs.
 * Includes dynamic prompts based on selected mood/emotion/energy.
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BookOpen, Save, Trash2, ChevronDown, ChevronUp, Flame, Calendar, AlertTriangle } from 'lucide-react';
import { useJournalEntry, useJournalStats } from '@/hooks/useJournalEntry';
import { MoodEmotionChips, normalizeMood, normalizeEmotion } from '@/components/MoodEmotionChips';
import { 
  getActionPrompt, 
  shouldShowMinimalActionHelper, 
  getMinimalActionPrompt,
  getMinimalActionHelperText,
  DynamicPromptContext 
} from '@/lib/dynamicPrompts';
import { format } from 'date-fns';

// Prompts de reflexão aleatórios para inspirar o usuário
const PROMPTS = {
  insight: [
    'O que você aprendeu sobre si mesmo hoje?',
    'Qual padrão você percebeu nos seus pensamentos?',
    'O que você faria diferente hoje?',
    'Qual foi seu momento mais presente?',
    'O que te surpreendeu hoje?',
    'Qual crença você questionou hoje?',
    'O que você evitou enfrentar?',
    'Qual foi sua maior clareza?'
  ],
  action: [
    'Uma pausa consciente que você fez',
    'Uma conversa importante que teve',
    'Um limite que você respeitou',
    'Uma escolha alinhada com seus valores',
    'Um momento onde você foi gentil consigo',
    'Uma pequena vitória que conquistou',
    'Um hábito que praticou hoje',
    'Uma decisão difícil que tomou'
  ],
  gratitude: [
    'Uma pessoa que te apoiou',
    'Um momento simples que trouxe paz',
    'Algo em você que valoriza',
    'Uma oportunidade que surgiu',
    'Uma lição que a vida te ensinou',
    'Um conforto que tem em casa',
    'Uma habilidade que desenvolveu',
    'Uma memória que te aquece'
  ],
  free_note: [
    'O que está no seu coração agora?',
    'O que você gostaria de lembrar deste dia?',
    'O que você diria ao seu eu de amanhã?',
    'Qual pergunta você está carregando?',
    'O que você precisa deixar ir?',
    'O que te dá força para seguir?'
  ]
};

function getRandomPrompt(field: keyof typeof PROMPTS): string {
  const prompts = PROMPTS[field];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

interface MicroJournalProps {
  themeId?: string | null;
  visualizationId?: string | null;
  energy?: number | null;
}

export function MicroJournal({ themeId, visualizationId, energy }: MicroJournalProps) {
  const [showMore, setShowMore] = useState(false);
  
  const {
    formData,
    updateField,
    save,
    clearForm,
    isLoading,
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
  } = useJournalEntry();

  const { stats } = useJournalStats();

  // Gerar prompts aleatórios uma vez por montagem do componente
  const randomPrompts = useMemo(() => ({
    insight: getRandomPrompt('insight'),
    action: getRandomPrompt('action'),
    gratitude: getRandomPrompt('gratitude'),
    free_note: getRandomPrompt('free_note'),
  }), []);

  // Dynamic prompt context
  const promptContext: DynamicPromptContext = useMemo(() => ({
    mood: formData.mood || null,
    emotion: formData.emotion || null,
    energy: energy ?? null,
  }), [formData.mood, formData.emotion, energy]);

  // Get dynamic action prompt
  const actionPrompt = useMemo(() => {
    if (shouldShowMinimalActionHelper(promptContext)) {
      return getMinimalActionPrompt();
    }
    return getActionPrompt(promptContext) || randomPrompts.action;
  }, [promptContext, randomPrompts.action]);

  const showLowEnergyHelper = shouldShowMinimalActionHelper(promptContext);

  const handleMoodChange = (key: string, other: string | null) => {
    updateField('mood', key);
    updateField('moodOther', other || '');
  };

  const handleEmotionChange = (key: string, other: string | null) => {
    updateField('emotion', key);
    updateField('emotionOther', other || '');
  };

  const handleSave = async () => {
    await save(themeId, visualizationId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center text-muted-foreground">
            Carregando diário...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Diário (60s)
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{stats.daysLast30}/30</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span>{stats.currentStreak} dias</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mood/Emotion Chip Selectors */}
        <MoodEmotionChips
          mood={formData.mood}
          moodOther={formData.moodOther}
          emotion={formData.emotion}
          emotionOther={formData.emotionOther}
          onMoodChange={handleMoodChange}
          onEmotionChange={handleEmotionChange}
        />

        <div className="space-y-1.5">
          <Label htmlFor="insight" className="text-xs">
            1 insight de hoje
            <span className="ml-2 text-muted-foreground">({formData.insight.length}/160)</span>
          </Label>
          <Input
            id="insight"
            placeholder={randomPrompts.insight}
            value={formData.insight}
            onChange={(e) => updateField('insight', e.target.value)}
            maxLength={160}
          />
        </div>

        {/* Low energy helper text */}
        {showLowEnergyHelper && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{getMinimalActionHelperText()}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="action" className="text-xs">
            1 ação pequena hoje
            <span className="ml-2 text-muted-foreground">({formData.action.length}/160)</span>
          </Label>
          <Input
            id="action"
            placeholder={actionPrompt}
            value={formData.action}
            onChange={(e) => updateField('action', e.target.value)}
            maxLength={160}
          />
        </div>

        {/* Expandable section */}
        <Collapsible open={showMore} onOpenChange={setShowMore}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground">
              {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showMore ? 'Menos campos' : 'Adicionar mais'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="gratitude" className="text-xs">
                Gratidão (opcional)
                <span className="ml-2 text-muted-foreground">({formData.gratitude.length}/160)</span>
              </Label>
              <Input
                id="gratitude"
                placeholder={randomPrompts.gratitude}
                value={formData.gratitude}
                onChange={(e) => updateField('gratitude', e.target.value)}
                maxLength={160}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="free_note" className="text-xs">
                Nota livre (opcional)
                <span className="ml-2 text-muted-foreground">({formData.free_note.length}/800)</span>
              </Label>
              <Textarea
                id="free_note"
                placeholder={randomPrompts.free_note}
                value={formData.free_note}
                onChange={(e) => updateField('free_note', e.target.value)}
                maxLength={800}
                rows={3}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearForm}
              className="gap-2 text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Não salvo
              </Badge>
            )}
            {lastSavedAt && !hasUnsavedChanges && (
              <span>Salvo às {format(lastSavedAt, 'HH:mm')}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
