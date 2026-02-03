/**
 * Gratitude Card Component
 * Sprint: Gratitude Section
 * 
 * Morning: Text input + category chips
 * Night: Simple text input (minimal style)
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, User, Users, Briefcase, Leaf, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GratitudeCategory = 'Self' | 'Relationships' | 'Work' | 'Nature/God' | 'Circumstance';

interface GratitudeCategoryChip {
  value: GratitudeCategory;
  label: string;
  icon: React.ReactNode;
}

const categories: GratitudeCategoryChip[] = [
  { value: 'Self', label: 'Eu', icon: <User className="h-3.5 w-3.5" /> },
  { value: 'Relationships', label: 'Relações', icon: <Users className="h-3.5 w-3.5" /> },
  { value: 'Work', label: 'Trabalho', icon: <Briefcase className="h-3.5 w-3.5" /> },
  { value: 'Nature/God', label: 'Natureza/Deus', icon: <Leaf className="h-3.5 w-3.5" /> },
  { value: 'Circumstance', label: 'Circunstância', icon: <HelpCircle className="h-3.5 w-3.5" /> },
];

const MAX_CHARS = 100;

interface MorningGratitudeCardProps {
  variant: 'morning';
  text: string;
  category: GratitudeCategory | null;
  onTextChange: (text: string) => void;
  onCategoryChange: (category: GratitudeCategory) => void;
  disabled?: boolean;
}

interface NightGratitudeCardProps {
  variant: 'night';
  text: string;
  onTextChange: (text: string) => void;
  disabled?: boolean;
}

type GratitudeCardProps = MorningGratitudeCardProps | NightGratitudeCardProps;

export function GratitudeCard(props: GratitudeCardProps) {
  const { variant, text, onTextChange, disabled } = props;
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, MAX_CHARS);
    onTextChange(newValue);
  };

  const remaining = MAX_CHARS - text.length;
  const isNearLimit = remaining <= 15;
  const isAtLimit = remaining === 0;

  if (variant === 'morning') {
    const { category, onCategoryChange } = props as MorningGratitudeCardProps;
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Gratidão (Ancoragem)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Pelo que você é grato agora?"
              value={text}
              onChange={handleTextChange}
              disabled={disabled}
              maxLength={MAX_CHARS}
            />
            <div className={cn(
              "text-xs text-right",
              isAtLimit ? "text-destructive" : isNearLimit ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"
            )}>
              {remaining} caracteres restantes
            </div>
          </div>
          
          {/* Category chips */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Fonte da gratidão:</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onCategoryChange(cat.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    "border",
                    category === cat.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Night variant - minimal style
  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
          <Heart className="h-4 w-4" />
          Gratidão (Fechamento)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Input
          placeholder="Uma coisa boa que aconteceu hoje?"
          value={text}
          onChange={handleTextChange}
          disabled={disabled}
          maxLength={MAX_CHARS}
          className="bg-background"
        />
        <div className={cn(
          "text-xs text-right",
          isAtLimit ? "text-destructive" : isNearLimit ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"
        )}>
          {remaining}
        </div>
      </CardContent>
    </Card>
  );
}
