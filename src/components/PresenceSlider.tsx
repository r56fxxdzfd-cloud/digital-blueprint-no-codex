/**
 * Presence Slider Component
 * Sprint: Data Input Refactor
 * 
 * Slider for presence/mindfulness level 0-100%
 * Replaces auto-pilot text input with structured data
 */
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface PresenceSliderProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function PresenceSlider({ value, onChange, disabled }: PresenceSliderProps) {
  const displayValue = value ?? 50;
  
  const getLabel = (val: number): string => {
    if (val <= 20) return 'Muito no automático';
    if (val <= 40) return 'Pouca presença';
    if (val <= 60) return 'Parcialmente presente';
    if (val <= 80) return 'Boa presença';
    return 'Totalmente presente';
  };

  const getColor = (val: number): string => {
    if (val <= 20) return 'text-destructive';
    if (val <= 40) return 'text-orange-600 dark:text-orange-400';
    if (val <= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (val <= 80) return 'text-green-600 dark:text-green-400';
    return 'text-primary';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={cn("text-2xl font-bold", getColor(displayValue))}>
          {displayValue}%
        </span>
        <span className="text-sm text-muted-foreground">
          {getLabel(displayValue)}
        </span>
      </div>
      <Slider
        value={[displayValue]}
        onValueChange={([v]) => onChange(v)}
        max={100}
        min={0}
        step={5}
        disabled={disabled}
        className="py-2"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Auto-piloto</span>
        <span>100% presente</span>
      </div>
    </div>
  );
}
