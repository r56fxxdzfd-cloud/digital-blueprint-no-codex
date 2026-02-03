/**
 * Clarity Rating Component
 * Sprint: Data Input Refactor
 * 
 * Star rating for visualization clarity level (1-5)
 * Replaces simple checkbox for meditation completion
 */
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClarityRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ClarityRating({ value, onChange, disabled }: ClarityRatingProps) {
  const labels = ['Nenhuma', 'Pouca', 'Razoável', 'Boa', 'Excelente'];
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            className={cn(
              "p-1 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded",
              disabled && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
            aria-label={`Clareza ${star} de 5`}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                value && star <= value
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          {labels[value - 1]} clareza
        </p>
      )}
    </div>
  );
}
