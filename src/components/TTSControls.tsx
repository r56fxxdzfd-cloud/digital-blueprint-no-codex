import { Play, Pause, Square, Volume2, VolumeX, Clock, AlertTriangle, Activity, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/hooks/useTTS';

interface TTSControlsProps {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  isEnabled: boolean;
  onPlay: () => void;
  onTogglePause: () => void;
  onStop: () => void;
  onSkipEndSilence?: () => void;
  compact?: boolean;
  className?: string;
  // Duration estimation
  estimatedDurationMs?: number;
  endSilenceMs?: number;
  isShortScript?: boolean;
  isInEndSilence?: boolean;
  endSilenceRemainingMs?: number;
  // Pacing debug info
  currentChunk?: number;
  totalChunks?: number;
  currentRate?: number;
}

export function TTSControls({
  isSpeaking,
  isPaused,
  isSupported,
  isEnabled,
  onPlay,
  onTogglePause,
  onStop,
  onSkipEndSilence,
  compact = false,
  className,
  estimatedDurationMs,
  endSilenceMs = 30000,
  isShortScript,
  isInEndSilence,
  endSilenceRemainingMs = 0,
  currentChunk,
  totalChunks,
  currentRate,
}: TTSControlsProps) {
  if (!isSupported) {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        TTS não suportado
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <VolumeX className="h-3 w-3" />
        <span>TTS desabilitado</span>
      </div>
    );
  }

  const buttonSize = compact ? "h-7 w-7" : "h-8 w-8";
  const iconSize = compact ? "h-3 w-3" : "h-4 w-4";
  const endSilenceSeconds = Math.ceil(endSilenceRemainingMs / 1000);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1">
        {!isSpeaking ? (
          <Button
            variant="outline"
            size="icon"
            className={buttonSize}
            onClick={onPlay}
            title="Ouvir"
          >
            <Play className={iconSize} />
          </Button>
        ) : (
          <>
            {/* During end silence: show "Encerrar silêncio" button instead of pause */}
            {isInEndSilence ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onSkipEndSilence}
                  title="Encerrar silêncio"
                  className="gap-1"
                >
                  <StopCircle className={iconSize} />
                  <span className={compact ? "hidden" : ""}>Encerrar</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={buttonSize}
                  onClick={onStop}
                  title="Parar"
                >
                  <Square className={iconSize} />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className={buttonSize}
                  onClick={onTogglePause}
                  title={isPaused ? "Retomar" : "Pausar"}
                >
                  {isPaused ? (
                    <Play className={iconSize} />
                  ) : (
                    <Pause className={iconSize} />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={buttonSize}
                  onClick={onStop}
                  title="Parar"
                >
                  <Square className={iconSize} />
                </Button>
              </>
            )}
          </>
        )}
        
        {/* Status indicators when speaking */}
        {isSpeaking && (
          <div className="flex items-center gap-2 ml-2">
            {isInEndSilence ? (
              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                <Clock className={iconSize} />
                <span>Silêncio final: {endSilenceSeconds}s</span>
              </div>
            ) : isPaused ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Volume2 className={iconSize} />
                <span className={compact ? "hidden" : ""}>Pausado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-primary animate-pulse">
                <Volume2 className={iconSize} />
                <span className={compact ? "hidden" : ""}>Falando…</span>
              </div>
            )}
            
            {/* Pacing debug info (only when not in end silence) */}
            {!compact && !isInEndSilence && currentChunk !== undefined && totalChunks !== undefined && totalChunks > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground border-l pl-2">
                <Activity className="h-3 w-3" />
                <span>
                  {currentRate?.toFixed(2)}x | chunk {currentChunk + 1}/{totalChunks}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
    </div>
  );
}
