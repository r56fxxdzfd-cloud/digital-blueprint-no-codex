/**
 * SOS Modal - Global Quick Reset Feature
 * Sprint: Core Habit Loop + SOS + Chips + Focus Mode + Dynamic Prompts
 * 
 * Provides 3 quick breathing/grounding exercises:
 * - Respiração 2 min (120s)
 * - Respiração 60s (60s)
 * - Aterramento 30s (30s)
 * 
 * Audio feedback: Bell at start, TTS for cues
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBellSound } from '@/hooks/useBellSound';

type TechniqueType = 'breathing-478' | 'grounding-54321';

interface SOSExercise {
  id: string;
  name: string;
  description: string;
  durationSeconds: number;
  technique: TechniqueType;
  cues: { time: number; text: string }[];
}

// 4-7-8 Breathing: 4s inhale, 7s hold, 8s exhale = 19s per cycle
const BREATH_478 = {
  inhale: 4000,
  hold: 7000,
  exhale: 8000,
  total: 19000,
};

// 5-4-3-2-1 Grounding cues (sensory awareness)
const GROUNDING_CUES = [
  { time: 0, text: '5 coisas que você VÊ ao seu redor…' },
  { time: 6, text: '4 coisas que você pode TOCAR…' },
  { time: 12, text: '3 sons que você OUVE…' },
  { time: 18, text: '2 cheiros que você SENTE…' },
  { time: 24, text: '1 sabor na sua boca… Você está aqui, agora.' },
];

const EXERCISES: SOSExercise[] = [
  {
    id: 'breath-2min',
    name: 'Respiração 4-7-8',
    description: '2 minutos',
    durationSeconds: 120,
    technique: 'breathing-478',
    cues: [
      { time: 0, text: 'Inspire por 4 segundos… segure 7… expire 8…' },
      { time: 38, text: 'Continue no ritmo. Inspire… segure… expire…' },
      { time: 76, text: 'Solte ombros e mandíbula. Mantenha o ritmo…' },
      { time: 110, text: 'Última respiração. Perceba a calma.' },
    ],
  },
  {
    id: 'breath-1min',
    name: 'Respiração 4-7-8',
    description: '1 minuto',
    durationSeconds: 60,
    technique: 'breathing-478',
    cues: [
      { time: 0, text: 'Inspire por 4 segundos… segure 7… expire 8…' },
      { time: 19, text: 'Continue. Inspire… segure… expire…' },
      { time: 50, text: 'Última respiração. Perceba a calma.' },
    ],
  },
  {
    id: 'grounding-30s',
    name: 'Aterramento 5-4-3-2-1',
    description: '30 segundos',
    durationSeconds: 30,
    technique: 'grounding-54321',
    cues: GROUNDING_CUES,
  },
];

type Phase = 'select' | 'running' | 'paused' | 'completed';
type BreathPhase = 'inspire' | 'segure' | 'expire' | 'observe';

interface SOSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Calculate current breath phase for 4-7-8 technique
function getBreathPhase478(elapsedMs: number): BreathPhase {
  const cyclePosition = elapsedMs % BREATH_478.total;
  if (cyclePosition < BREATH_478.inhale) return 'inspire';
  if (cyclePosition < BREATH_478.inhale + BREATH_478.hold) return 'segure';
  return 'expire';
}

// Get scale value for 4-7-8 breathing circle (0.5 to 1.0)
function getBreathScale478(elapsedMs: number): number {
  const cyclePosition = elapsedMs % BREATH_478.total;
  
  if (cyclePosition < BREATH_478.inhale) {
    // Inhaling: scale from 0.5 to 1.0
    const progress = cyclePosition / BREATH_478.inhale;
    return 0.5 + (0.5 * progress);
  } else if (cyclePosition < BREATH_478.inhale + BREATH_478.hold) {
    // Holding: stay at 1.0
    return 1.0;
  } else {
    // Exhaling: scale from 1.0 to 0.5
    const exhaleProgress = (cyclePosition - BREATH_478.inhale - BREATH_478.hold) / BREATH_478.exhale;
    return 1.0 - (0.5 * exhaleProgress);
  }
}

// Get current grounding step (1-5) for visual display
function getGroundingStep(elapsedSeconds: number): number {
  if (elapsedSeconds < 6) return 5;
  if (elapsedSeconds < 12) return 4;
  if (elapsedSeconds < 18) return 3;
  if (elapsedSeconds < 24) return 2;
  return 1;
}

export function SOSModal({ open, onOpenChange }: SOSModalProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedExercise, setSelectedExercise] = useState<SOSExercise | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentCue, setCurrentCue] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inspire');
  const [breathScale, setBreathScale] = useState(0.6);
  const intervalRef = useRef<number | null>(null);
  const breathIntervalRef = useRef<number | null>(null);
  const lastSpokenCueRef = useRef<string>('');
  const { playBell } = useBellSound();

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (breathIntervalRef.current) {
      clearInterval(breathIntervalRef.current);
      breathIntervalRef.current = null;
    }
  }, []);

  const speakCue = useCallback((text: string) => {
    if (!audioEnabled) return;
    if (lastSpokenCueRef.current === text) return; // Don't repeat same cue
    
    lastSpokenCueRef.current = text;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    
    // Try to find a pt-BR voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt')) || voices[0];
    if (ptVoice) utterance.voice = ptVoice;
    
    window.speechSynthesis.speak(utterance);
  }, [audioEnabled]);

  const startTimer = useCallback((exercise: SOSExercise) => {
    clearTimer();
    
    // Main timer (1s intervals for countdown)
    intervalRef.current = window.setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    
    // Animation timer (50ms intervals for smooth animation)
    const startTime = Date.now();
    breathIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedMs(elapsed);
      
      if (exercise.technique === 'breathing-478') {
        setBreathPhase(getBreathPhase478(elapsed));
        setBreathScale(getBreathScale478(elapsed));
      } else {
        // Grounding: gentle pulse animation
        const pulse = 0.85 + 0.15 * Math.sin(elapsed / 1000);
        setBreathScale(pulse);
        setBreathPhase('observe');
      }
    }, 50);
  }, [clearTimer]);

  // Update cue based on elapsed time and speak it
  useEffect(() => {
    if (!selectedExercise || phase === 'select' || phase === 'paused') return;
    
    const reversedCues = [...selectedExercise.cues].reverse();
    const activeCue = reversedCues.find(c => elapsedSeconds >= c.time);
    if (activeCue && activeCue.text !== currentCue) {
      setCurrentCue(activeCue.text);
      speakCue(activeCue.text);
    }
  }, [elapsedSeconds, selectedExercise, phase, currentCue, speakCue]);

  // Check completion
  useEffect(() => {
    if (selectedExercise && elapsedSeconds >= selectedExercise.durationSeconds) {
      clearTimer();
      setPhase('completed');
    }
  }, [elapsedSeconds, selectedExercise, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const handleSelectExercise = (exercise: SOSExercise) => {
    setSelectedExercise(exercise);
    setElapsedSeconds(0);
    setPhase('running');
    lastSpokenCueRef.current = '';
    
    const firstCue = exercise.cues[0]?.text || '';
    setCurrentCue(firstCue);
    
    // Play bell and speak first cue
    if (audioEnabled) {
      playBell();
      // Delay speech slightly so bell plays first
      setTimeout(() => speakCue(firstCue), 800);
    }
    
    startTimer(exercise);
  };

  const handlePause = () => {
    clearTimer();
    window.speechSynthesis.cancel();
    setPhase('paused');
  };

  const handleResume = () => {
    if (!selectedExercise) return;
    setPhase('running');
    lastSpokenCueRef.current = ''; // Allow re-speaking current cue
    startTimer(selectedExercise);
  };

  const handleStop = () => {
    clearTimer();
    window.speechSynthesis.cancel();
    setPhase('select');
    setSelectedExercise(null);
    setElapsedSeconds(0);
    setCurrentCue('');
    lastSpokenCueRef.current = '';
  };

  const handleRestart = () => {
    if (!selectedExercise) return;
    window.speechSynthesis.cancel();
    setElapsedSeconds(0);
    setPhase('running');
    lastSpokenCueRef.current = '';
    
    const firstCue = selectedExercise.cues[0]?.text || '';
    setCurrentCue(firstCue);
    
    if (audioEnabled) {
      playBell();
      setTimeout(() => speakCue(firstCue), 800);
    }
    
    startTimer(selectedExercise);
  };

  // Play bell when exercise completes
  useEffect(() => {
    if (phase === 'completed' && audioEnabled) {
      playBell();
    }
  }, [phase, audioEnabled, playBell]);

  const handleClose = () => {
    handleStop();
    onOpenChange(false);
  };

  const remainingSeconds = selectedExercise 
    ? Math.max(0, selectedExercise.durationSeconds - elapsedSeconds) 
    : 0;
  const progressPercent = selectedExercise 
    ? (elapsedSeconds / selectedExercise.durationSeconds) * 100 
    : 0;
  const isGrounding = selectedExercise?.technique === 'grounding-54321';
  const groundingStep = isGrounding ? getGroundingStep(elapsedSeconds) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {phase === 'select' ? 'Reset rápido' : selectedExercise?.name}
          </DialogTitle>
        </DialogHeader>

        {phase === 'select' && (
          <div className="space-y-3 py-4">
            {/* Audio toggle */}
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="gap-2 text-muted-foreground"
              >
                {audioEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span className="text-xs">Áudio ativo</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" />
                    <span className="text-xs">Áudio desativado</span>
                  </>
                )}
              </Button>
            </div>
            
            {EXERCISES.map(exercise => (
              <Button
                key={exercise.id}
                variant="outline"
                className="w-full h-auto py-3 justify-start gap-3 flex-col items-start"
                onClick={() => handleSelectExercise(exercise)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Play className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="text-left">
                    <span className="text-base font-medium">{exercise.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({exercise.description})</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground pl-8">
                  {exercise.technique === 'breathing-478' 
                    ? 'Inspire 4s → Segure 7s → Expire 8s' 
                    : '5 vejo, 4 toco, 3 ouço, 2 cheiro, 1 sabor'}
                </span>
              </Button>
            ))}
          </div>
        )}

        {(phase === 'running' || phase === 'paused' || phase === 'completed') && (
          <div className="py-6 space-y-6">
            {/* Breathing Circle Animation */}
            <div className="flex justify-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Outer glow ring */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-full transition-all duration-300",
                    phase === 'running' && "bg-primary/5"
                  )}
                  style={{
                    transform: phase === 'running' ? `scale(${breathScale * 1.1})` : 'scale(0.7)',
                    opacity: phase === 'paused' ? 0.3 : 0.6,
                  }}
                />
                
                {/* Main breathing circle */}
                <div 
                  className={cn(
                    "absolute rounded-full border-4 border-primary/40 bg-primary/10 transition-all",
                    phase === 'paused' && "opacity-50"
                  )}
                  style={{
                    width: '160px',
                    height: '160px',
                    transform: phase === 'running' ? `scale(${breathScale})` : 'scale(0.6)',
                    transitionDuration: '100ms',
                    boxShadow: phase === 'running' 
                      ? `0 0 ${30 * breathScale}px hsl(var(--primary) / 0.3)` 
                      : 'none',
                  }}
                />
                
                {/* Inner content */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                  {phase === 'completed' ? (
                    <span className="text-xl font-medium text-primary">Completo ✓</span>
                  ) : isGrounding ? (
                    <>
                      {/* Grounding step indicator */}
                      <span className="text-4xl font-bold text-primary mb-1">
                        {groundingStep}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {groundingStep === 5 && 'coisas que vejo'}
                        {groundingStep === 4 && 'coisas que toco'}
                        {groundingStep === 3 && 'sons que ouço'}
                        {groundingStep === 2 && 'cheiros'}
                        {groundingStep === 1 && 'sabor'}
                      </span>
                      <span className="text-sm font-mono text-muted-foreground mt-2">
                        {formatTime(remainingSeconds)}
                      </span>
                    </>
                  ) : (
                    <>
                      {/* Breath phase indicator for 4-7-8 */}
                      <span className={cn(
                        "text-sm font-medium uppercase tracking-wider mb-1 transition-colors",
                        breathPhase === 'inspire' && "text-primary",
                        breathPhase === 'segure' && "text-accent-foreground",
                        breathPhase === 'expire' && "text-muted-foreground"
                      )}>
                        {phase === 'paused' ? 'pausado' : breathPhase}
                      </span>
                      
                      {/* Countdown for current phase */}
                      <span className="text-xs text-muted-foreground mb-1">
                        {breathPhase === 'inspire' && '4 segundos'}
                        {breathPhase === 'segure' && '7 segundos'}
                        {breathPhase === 'expire' && '8 segundos'}
                      </span>
                      
                      {/* Timer */}
                      <span className="text-3xl font-mono font-bold">
                        {formatTime(remainingSeconds)}
                      </span>
                      
                      <span className="text-xs text-muted-foreground mt-1">
                        restante
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <Progress value={progressPercent} className="h-1.5" />

            {/* Current Cue */}
            <div className={cn(
              "text-center p-4 rounded-lg bg-primary/10 min-h-[60px] flex items-center justify-center",
              phase === 'paused' && "opacity-50"
            )}>
              <p className="text-sm text-primary font-medium italic">
                "{currentCue}"
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {phase === 'running' && (
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
                  <Button onClick={handleRestart} variant="outline" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Repetir
                  </Button>
                  <Button onClick={handleClose} className="gap-2">
                    Fechar
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
