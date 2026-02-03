/**
 * Intention Input Component
 * Sprint: Data Input Refactor
 * 
 * Short text input for main daily intention
 * Replaces long-form journal textarea with 50 char limit
 */
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface IntentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MAX_CHARS = 50;

export function IntentionInput({ value, onChange, placeholder, disabled }: IntentionInputProps) {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, MAX_CHARS);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const remaining = MAX_CHARS - localValue.length;
  const isNearLimit = remaining <= 10;
  const isAtLimit = remaining === 0;

  return (
    <div className="space-y-1">
      <Input
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder || 'A única coisa que importa hoje...'}
        maxLength={MAX_CHARS}
        disabled={disabled}
      />
      <div className={cn(
        "text-xs text-right",
        isAtLimit ? "text-destructive" : isNearLimit ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"
      )}>
        {remaining} caracteres restantes
      </div>
    </div>
  );
}
