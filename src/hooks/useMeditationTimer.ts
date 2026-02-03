import { useState, useEffect, useCallback, useRef } from 'react';

export interface MeditationTimerState {
  isActive: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  totalSeconds: number;
  progress: number; // 0 to 1
}

interface UseMeditationTimerOptions {
  durationMinutes: number;
  onComplete?: () => void;
}

export function useMeditationTimer({ durationMinutes, onComplete }: UseMeditationTimerOptions) {
  const [state, setState] = useState<MeditationTimerState>({
    isActive: false,
    isPaused: false,
    elapsedSeconds: 0,
    totalSeconds: durationMinutes * 60,
    progress: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Update total when duration changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      totalSeconds: durationMinutes * 60,
    }));
  }, [durationMinutes]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    
    setState({
      isActive: true,
      isPaused: false,
      elapsedSeconds: 0,
      totalSeconds: durationMinutes * 60,
      progress: 0,
    });

    intervalRef.current = setInterval(() => {
      setState(prev => {
        const newElapsed = prev.elapsedSeconds + 1;
        const newProgress = Math.min(newElapsed / prev.totalSeconds, 1);
        
        if (newElapsed >= prev.totalSeconds) {
          clearTimer();
          onCompleteRef.current?.();
          return {
            ...prev,
            isActive: false,
            isPaused: false,
            elapsedSeconds: prev.totalSeconds,
            progress: 1,
          };
        }
        
        return {
          ...prev,
          elapsedSeconds: newElapsed,
          progress: newProgress,
        };
      });
    }, 1000);
  }, [durationMinutes, clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setState(prev => ({ ...prev, isPaused: true }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (!state.isPaused) return;
    
    intervalRef.current = setInterval(() => {
      setState(prev => {
        const newElapsed = prev.elapsedSeconds + 1;
        const newProgress = Math.min(newElapsed / prev.totalSeconds, 1);
        
        if (newElapsed >= prev.totalSeconds) {
          clearTimer();
          onCompleteRef.current?.();
          return {
            ...prev,
            isActive: false,
            isPaused: false,
            elapsedSeconds: prev.totalSeconds,
            progress: 1,
          };
        }
        
        return {
          ...prev,
          elapsedSeconds: newElapsed,
          progress: newProgress,
        };
      });
    }, 1000);
    
    setState(prev => ({ ...prev, isPaused: false }));
  }, [state.isPaused, clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setState({
      isActive: false,
      isPaused: false,
      elapsedSeconds: 0,
      totalSeconds: durationMinutes * 60,
      progress: 0,
    });
  }, [durationMinutes, clearTimer]);

  const togglePause = useCallback(() => {
    if (state.isPaused) {
      resume();
    } else {
      pause();
    }
  }, [state.isPaused, pause, resume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    ...state,
    start,
    pause,
    resume,
    stop,
    togglePause,
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

