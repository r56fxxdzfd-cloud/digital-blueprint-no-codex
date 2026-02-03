/**
 * Mood/Emotion Chip Selectors
 * Sprint: Core Habit Loop + SOS + Chips + Focus Mode + Dynamic Prompts
 * 
 * Canonical chip lists for mood and emotion selection.
 * Supports "Outro" option with custom text input.
 * Stores canonical keys (lowercase, no accents) in DB.
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Canonical keys (lowercase, no accents) - stored in DB
// Display labels with accents for UI
export const MOOD_OPTIONS = [
  { key: 'sereno', label: 'Sereno' },
  { key: 'tranquilo', label: 'Tranquilo' },
  { key: 'focado', label: 'Focado' },
  { key: 'energizado', label: 'Energizado' },
  { key: 'cansado', label: 'Cansado' },
  { key: 'ansioso', label: 'Ansioso' },
  { key: 'irritado', label: 'Irritado' },
  { key: 'confiante', label: 'Confiante' },
  { key: 'desanimado', label: 'Desanimado' },
  { key: 'sobrecarregado', label: 'Sobrecarregado' },
] as const;

export const EMOTION_OPTIONS = [
  { key: 'gratidao', label: 'Gratidão' },
  { key: 'alegria', label: 'Alegria' },
  { key: 'calma', label: 'Calma' },
  { key: 'entusiasmo', label: 'Entusiasmo' },
  { key: 'medo', label: 'Medo' },
  { key: 'raiva', label: 'Raiva' },
  { key: 'tristeza', label: 'Tristeza' },
  { key: 'confianca', label: 'Confiança' },
  { key: 'amor', label: 'Amor' },
  { key: 'frustracao', label: 'Frustração' },
] as const;

export type MoodKey = typeof MOOD_OPTIONS[number]['key'] | 'outro';
export type EmotionKey = typeof EMOTION_OPTIONS[number]['key'] | 'outro';

// Migration mapping for existing free-text values
const MOOD_MIGRATION_MAP: Record<string, MoodKey> = {
  'serena': 'sereno',
  'sereno': 'sereno',
  'tranquila': 'tranquilo',
  'tranquilo': 'tranquilo',
  'focada': 'focado',
  'focado': 'focado',
  'energizada': 'energizado',
  'energizado': 'energizado',
  'cansada': 'cansado',
  'cansado': 'cansado',
  'ansiosa': 'ansioso',
  'ansioso': 'ansioso',
  'irritada': 'irritado',
  'irritado': 'irritado',
  'confiante': 'confiante',
  'desanimada': 'desanimado',
  'desanimado': 'desanimado',
  'sobrecarregada': 'sobrecarregado',
  'sobrecarregado': 'sobrecarregado',
};

const EMOTION_MIGRATION_MAP: Record<string, EmotionKey> = {
  'gratidão': 'gratidao',
  'gratidao': 'gratidao',
  'alegria': 'alegria',
  'calma': 'calma',
  'entusiasmo': 'entusiasmo',
  'medo': 'medo',
  'raiva': 'raiva',
  'tristeza': 'tristeza',
  'confiança': 'confianca',
  'confianca': 'confianca',
  'amor': 'amor',
  'frustração': 'frustracao',
  'frustracao': 'frustracao',
};

// Normalize existing mood value to canonical key
export function normalizeMood(value: string | null): { key: MoodKey; other: string | null } {
  if (!value) return { key: '' as MoodKey, other: null };
  
  const lower = value.toLowerCase().trim();
  
  // Check exact match first
  if (MOOD_OPTIONS.some(m => m.key === lower)) {
    return { key: lower as MoodKey, other: null };
  }
  
  // Check migration map
  if (MOOD_MIGRATION_MAP[lower]) {
    return { key: MOOD_MIGRATION_MAP[lower], other: null };
  }
  
  // Store as "outro"
  return { key: 'outro', other: value };
}

// Normalize existing emotion value to canonical key
export function normalizeEmotion(value: string | null): { key: EmotionKey; other: string | null } {
  if (!value) return { key: '' as EmotionKey, other: null };
  
  const lower = value.toLowerCase().trim();
  
  // Check exact match first
  if (EMOTION_OPTIONS.some(e => e.key === lower)) {
    return { key: lower as EmotionKey, other: null };
  }
  
  // Check migration map
  if (EMOTION_MIGRATION_MAP[lower]) {
    return { key: EMOTION_MIGRATION_MAP[lower], other: null };
  }
  
  // Store as "outro"
  return { key: 'outro', other: value };
}

interface ChipSelectorProps {
  label: string;
  options: readonly { key: string; label: string }[];
  value: string;
  otherValue?: string;
  onChange: (key: string, otherText: string | null) => void;
  lastUsed?: string | null;
}

export function ChipSelector({
  label,
  options,
  value,
  otherValue,
  onChange,
  lastUsed,
}: ChipSelectorProps) {
  const [showOtherInput, setShowOtherInput] = useState(value === 'outro');
  const [otherText, setOtherText] = useState(otherValue || '');

  const handleSelect = (key: string) => {
    if (key === 'outro') {
      setShowOtherInput(true);
      onChange('outro', otherText || null);
    } else {
      setShowOtherInput(false);
      setOtherText('');
      onChange(key, null);
    }
  };

  const handleOtherChange = (text: string) => {
    setOtherText(text);
    onChange('outro', text || null);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      
      {/* Quick suggestion for last used */}
      {lastUsed && lastUsed !== value && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Sugestão:</span>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => handleSelect(lastUsed)}
          >
            {options.find(o => o.key === lastUsed)?.label || lastUsed}
          </Badge>
        </div>
      )}
      
      <div className="flex flex-wrap gap-1.5">
        {options.map(option => (
          <Badge
            key={option.key}
            variant={value === option.key ? 'default' : 'outline'}
            className={cn(
              "cursor-pointer transition-all text-xs py-1 px-2",
              value === option.key 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-primary/10 hover:border-primary/50"
            )}
            onClick={() => handleSelect(option.key)}
          >
            {option.label}
          </Badge>
        ))}
        <Badge
          variant={value === 'outro' ? 'default' : 'outline'}
          className={cn(
            "cursor-pointer transition-all text-xs py-1 px-2",
            value === 'outro'
              ? "bg-primary text-primary-foreground"
              : "hover:bg-primary/10 hover:border-primary/50"
          )}
          onClick={() => handleSelect('outro')}
        >
          Outro…
        </Badge>
      </div>

      {showOtherInput && (
        <Input
          placeholder="Digite aqui..."
          value={otherText}
          onChange={(e) => handleOtherChange(e.target.value)}
          maxLength={30}
          className="h-8 text-sm animate-fade-in"
        />
      )}
    </div>
  );
}

interface MoodEmotionChipsProps {
  mood: string;
  moodOther?: string;
  emotion: string;
  emotionOther?: string;
  onMoodChange: (key: string, other: string | null) => void;
  onEmotionChange: (key: string, other: string | null) => void;
  lastUsedMood?: string | null;
  lastUsedEmotion?: string | null;
}

export function MoodEmotionChips({
  mood,
  moodOther,
  emotion,
  emotionOther,
  onMoodChange,
  onEmotionChange,
  lastUsedMood,
  lastUsedEmotion,
}: MoodEmotionChipsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ChipSelector
        label="Humor"
        options={MOOD_OPTIONS}
        value={mood}
        otherValue={moodOther}
        onChange={onMoodChange}
        lastUsed={lastUsedMood}
      />
      <ChipSelector
        label="Emoção"
        options={EMOTION_OPTIONS}
        value={emotion}
        otherValue={emotionOther}
        onChange={onEmotionChange}
        lastUsed={lastUsedEmotion}
      />
    </div>
  );
}
