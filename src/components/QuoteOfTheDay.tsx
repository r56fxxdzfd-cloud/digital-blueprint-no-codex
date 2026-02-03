/**
 * Quote of the Day Component
 * Sprint: Data Input Refactor
 * 
 * Updated to include "Li e entendi" checkbox for tracking quote absorption
 */
import { Quote as QuoteIcon, RefreshCw, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyQuote } from '@/hooks/useQuotes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QuoteOfTheDayProps {
  themeId: string | null;
  language?: string;
  quoteAbsorbed?: boolean;
  onQuoteAbsorbedChange?: (absorbed: boolean) => void;
}

export function QuoteOfTheDay({ 
  themeId, 
  language = 'pt-BR',
  quoteAbsorbed,
  onQuoteAbsorbedChange 
}: QuoteOfTheDayProps) {
  const { data: quote, isLoading, changeQuote, isChanging } = useDailyQuote(new Date(), language, themeId);
  const { toast } = useToast();

  const handleChange = async () => {
    try {
      await changeQuote();
      toast({ title: 'Quote atualizada', description: 'Nova citação selecionada' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível trocar a citação', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-3">
            <QuoteIcon className="h-5 w-5 text-primary/40 flex-shrink-0 mt-1" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quote) {
    return null;
  }

  const attribution = [
    quote.author || 'Anônimo',
    quote.source ? `— ${quote.source}` : null,
  ].filter(Boolean).join(' ');

  return (
    <Card className={cn(
      "border-primary/20",
      quoteAbsorbed ? "bg-primary/10" : "bg-primary/5"
    )}>
      <CardContent className="pt-5 pb-4">
        <div className="flex gap-3">
          <QuoteIcon className="h-5 w-5 text-primary/60 flex-shrink-0 mt-1" />
          <div className="space-y-3 flex-1">
            <p className="text-foreground italic leading-relaxed">
              "{quote.quote_text}"
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {attribution}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChange}
                disabled={isChanging}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isChanging ? 'animate-spin' : ''}`} />
                Trocar
              </Button>
            </div>
            
            {/* Quote absorbed checkbox */}
            {onQuoteAbsorbedChange && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="quote-absorbed"
                    checked={quoteAbsorbed}
                    onCheckedChange={(checked) => onQuoteAbsorbedChange(checked === true)}
                  />
                  <Label 
                    htmlFor="quote-absorbed" 
                    className="text-sm cursor-pointer flex items-center gap-1"
                  >
                    Li e entendi
                    {quoteAbsorbed && <CheckCircle className="h-3 w-3 text-primary" />}
                  </Label>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
