/**
 * Meditation Mode - Full Screen Focus Experience
 * Sprint: Core Habit Loop + SOS + Chips + Focus Mode + Dynamic Prompts
 * 
 * True distraction-free meditation with:
 * - Hidden navigation (via FocusModeContext)
 * - Circular timer
 * - TTS narration
 * - Bell sound on completion
 * - Silêncio final countdown
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Bell, Volume2, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMeditationTimer, formatTime } from '@/hooks/useMeditationTimer';
import { useBellSound } from '@/hooks/useBellSound';
import { useTTS, TTSSettings } from '@/hooks/useTTS';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { cn } from '@/lib/utils';

interface MeditationModeProps {
  title: string;
  script: string;
  durationMinutes: number;
  ttsSettings: Partial<TTSSettings>;
  onClose: (completed?: boolean) => void;
}

type MeditationPhase = 'ready' | 'playing' | 'paused' | 'completed';

export function MeditationMode({
  title,
  script,
  durationMinutes,
  ttsSettings,
  onClose,
}: MeditationModeProps) {
  const [phase, setPhase] = useState<MeditationPhase>('playing');
  const [showCompleted, setShowCompleted] = useState(false);
  const hasStartedRef = useRef(false);
  
  const { playBell, unlockAudio } = useBellSound();
  const { enterFocusMode, exitFocusMode } = useFocusMode();
  
  const tts = useTTS({ settings: ttsSettings });

  const handleComplete = useCallback(() => {
    setPhase('completed');
    setShowCompleted(true);
    
    // Play bell sound 3 times with delays
    playBell();
    setTimeout(() => playBell(), 1500);
    setTimeout(() => playBell(), 3000);
  }, [playBell]);

  const timer = useMeditationTimer({
    durationMinutes,
    onComplete: handleComplete,
  });

  // Sync TTS state with meditation phase
  useEffect(() => {
    if (tts.isSpeaking && !tts.isPaused) {
      if (phase !== 'playing') setPhase('playing');
    } else if (tts.isSpeaking && tts.isPaused) {
      if (phase !== 'paused') setPhase('paused');
    }
  }, [tts.isSpeaking, tts.isPaused, phase]);

  // Handle TTS end - trigger timer complete if TTS finishes
  useEffect(() => {
    if (phase === 'playing' && !tts.isSpeaking && timer.isActive) {
      // TTS finished but timer still running - that's okay, let timer continue
      // Or we can complete early based on TTS
    }
  }, [tts.isSpeaking, phase, timer.isActive]);

  // Auto-start when component mounts AND voices are loaded
  useEffect(() => {
    // Wait for voices to be loaded before starting TTS
    if (!hasStartedRef.current && tts.voices.length > 0 && tts.selectedVoice) {
      hasStartedRef.current = true;
      // Unlock audio context for iOS Safari before playing any sounds
      unlockAudio();
      enterFocusMode();
      timer.start();
      tts.speak(script, title);
    }
  }, [tts.voices, tts.selectedVoice, enterFocusMode, timer, tts, script, title, unlockAudio]);

  // Disable background scroll when in focus mode
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handlePause = () => {
    setPhase('paused');
    timer.pause();
    tts.pause();
  };

  const handleResume = () => {
    setPhase('playing');
    timer.resume();
    tts.resume();
  };

  const handleStop = () => {
    setPhase('ready');
    timer.stop();
    tts.stop();
    exitFocusMode();
    setShowCompleted(false);
  };

  const handleRestart = () => {
    handleStop();
    setTimeout(() => {
      setPhase('playing');
      setShowCompleted(false);
      timer.start();
      tts.speak(script, title);
    }, 100);
  };

  const handleClose = (completed = false) => {
    tts.stop();
    timer.stop();
    exitFocusMode();
    onClose(completed);
  };

  const handleExitFocus = () => {
    handleClose(false);
  };

  const remainingSeconds = timer.totalSeconds - timer.elapsedSeconds;
  const progressPercent = timer.progress * 100;

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      {/* Focus Mode Container - Full screen, minimal UI */}
      <div className="w-full max-w-md relative">
        {/* Exit Focus Button - Top left */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-12 left-0 gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleExitFocus}
        >
          <LogOut className="h-4 w-4" />
          Sair do foco
        </Button>

        {/* Close button - Top right */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0"
          onClick={() => handleClose(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
          <CardContent className="pt-8 pb-8 px-6">
            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Meditação Guiada</h2>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>

            {/* Circular Timer Display */}
            <div className="flex justify-center mb-8">
              <div className="relative w-48 h-48">
                {/* Background circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/20"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000"
                    strokeDasharray={`${progressPercent * 2.83} 283`}
                  />
                </svg>
                
                {/* Time display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {phase === 'completed' ? (
                    <div className="text-center">
                      <Bell className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                      <span className="text-lg font-medium text-primary">Completo</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-3xl font-mono font-bold">
                        {formatTime(remainingSeconds)}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {phase === 'paused' ? 'pausado' : 'restante'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <Progress value={progressPercent} className="h-1.5 mb-6" />

            {/* TTS Status */}
            {tts.isSpeaking && (
              <div className="flex items-center justify-center gap-2 text-sm text-primary mb-4 animate-pulse">
                <Volume2 className="h-4 w-4" />
                <span>{tts.isPaused ? 'Áudio pausado' : 'Narrando visualização...'}</span>
              </div>
            )}

            {/* End Silence Countdown - visible when in end silence phase */}
            {tts.isInEndSilence && (
              <div className="text-center mb-4 p-3 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground mb-1">Silêncio final</p>
                <p className="text-2xl font-mono font-bold text-primary">
                  {Math.ceil((tts.endSilenceRemainingMs || 0) / 1000)}s
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={tts.skipEndSilence}
                  className="mt-2 text-xs"
                >
                  Encerrar silêncio
                </Button>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {phase === 'playing' && (
                <>
                  <Button variant="outline" size="icon" onClick={handlePause}>
                    <Pause className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleStop}>
                    <Square className="h-5 w-5" />
                  </Button>
                </>
              )}

              {phase === 'paused' && (
                <>
                  <Button size="icon" onClick={handleResume}>
                    <Play className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleStop}>
                    <Square className="h-5 w-5" />
                  </Button>
                </>
              )}

              {phase === 'completed' && (
                <>
                  <Button onClick={handleRestart} size="lg" variant="outline" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Repetir
                  </Button>
                  <Button onClick={() => handleClose(true)} size="lg" className="gap-2">
                    Finalizar
                  </Button>
                </>
              )}
            </div>

            {/* Duration info */}
            <div className="text-center mt-6 text-xs text-muted-foreground">
              Duração: {durationMinutes} min • Som de sino ao final
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
