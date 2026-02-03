/**
 * Mood Meter Tiles Component
 * Sprint: Data Input Refactor
 * 
 * Yale Mood Meter zones represented as 4 colored tiles:
 * - Red: High Energy / Unpleasant (stressed, angry, anxious)
 * - Yellow: High Energy / Pleasant (excited, joyful, energized)
 * - Blue: Low Energy / Unpleasant (sad, tired, bored)
 * - Green: Low Energy / Pleasant (calm, peaceful, content)
 */
import { cn } from '@/lib/utils';

export type EmotionalZone = 'Red' | 'Yellow' | 'Blue' | 'Green';

interface MoodMeterTilesProps {
  value: EmotionalZone | null;
  onChange: (value: EmotionalZone) => void;
  disabled?: boolean;
}

const zones: { value: EmotionalZone; label: string; description: string; colorClass: string; bgClass: string }[] = [
  { 
    value: 'Red', 
    label: 'Vermelho', 
    description: 'Alta energia, desagradável',
    colorClass: 'border-red-500 text-red-500',
    bgClass: 'bg-red-500/20 hover:bg-red-500/30',
  },
  { 
    value: 'Yellow', 
    label: 'Amarelo', 
    description: 'Alta energia, agradável',
    colorClass: 'border-yellow-500 text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-500/20 hover:bg-yellow-500/30',
  },
  { 
    value: 'Blue', 
    label: 'Azul', 
    description: 'Baixa energia, desagradável',
    colorClass: 'border-blue-500 text-blue-500',
    bgClass: 'bg-blue-500/20 hover:bg-blue-500/30',
  },
  { 
    value: 'Green', 
    label: 'Verde', 
    description: 'Baixa energia, agradável',
    colorClass: 'border-green-500 text-green-500',
    bgClass: 'bg-green-500/20 hover:bg-green-500/30',
  },
];

export function MoodMeterTiles({ value, onChange, disabled }: MoodMeterTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {zones.map((zone) => (
        <button
          key={zone.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(zone.value)}
          className={cn(
            "p-4 rounded-lg border-2 transition-all text-center",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
            value === zone.value
              ? cn(zone.colorClass, zone.bgClass, "ring-2 ring-offset-2 ring-offset-background")
              : "border-muted bg-muted/30 hover:bg-muted/50"
          )}
        >
          <span className={cn(
            "font-medium text-sm",
            value === zone.value ? zone.colorClass.split(' ')[1] : "text-foreground"
          )}>
            {zone.label}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            {zone.description}
          </p>
        </button>
      ))}
    </div>
  );
}
