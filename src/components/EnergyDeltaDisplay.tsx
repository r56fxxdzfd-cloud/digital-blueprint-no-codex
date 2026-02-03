/**
 * Energy Delta Display Component
 * Sprint: Data Input Refactor
 * 
 * Shows the difference between morning and evening energy
 * Positive = gained energy (green), Negative = lost energy (red)
 */
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnergyDeltaDisplayProps {
  morningEnergy: number | null;
  eveningEnergy: number;
}

export function EnergyDeltaDisplay({ morningEnergy, eveningEnergy }: EnergyDeltaDisplayProps) {
  if (morningEnergy === null) {
    return null;
  }

  const delta = eveningEnergy - morningEnergy;
  
  const getColorClass = () => {
    if (delta > 0) return 'text-green-600 dark:text-green-400';
    if (delta < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getIcon = () => {
    if (delta > 0) return <ArrowUp className="h-4 w-4" />;
    if (delta < 0) return <ArrowDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (delta > 0) return `+${delta}`;
    return String(delta);
  };

  return (
    <div className={cn("flex items-center gap-1 text-sm font-medium", getColorClass())}>
      {getIcon()}
      <span>Variação: {getLabel()}</span>
    </div>
  );
}
