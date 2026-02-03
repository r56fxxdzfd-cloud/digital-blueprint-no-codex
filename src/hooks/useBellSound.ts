import { useCallback, useRef, useEffect } from 'react';

// Generate a meditation bell sound using Web Audio API
function createBellSound(audioContext: AudioContext): void {
  const now = audioContext.currentTime;
  
  // Create oscillators for a rich bell sound
  const fundamentalFreq = 528; // Hz - "healing" frequency
  
  // Main tone
  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(fundamentalFreq, now);
  gain1.gain.setValueAtTime(0.5, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 3);
  osc1.connect(gain1);
  gain1.connect(audioContext.destination);
  
  // Harmonic 1 (octave above)
  const osc2 = audioContext.createOscillator();
  const gain2 = audioContext.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(fundamentalFreq * 2, now);
  gain2.gain.setValueAtTime(0.25, now);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 2);
  osc2.connect(gain2);
  gain2.connect(audioContext.destination);
  
  // Harmonic 2 (fifth above octave)
  const osc3 = audioContext.createOscillator();
  const gain3 = audioContext.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(fundamentalFreq * 3, now);
  gain3.gain.setValueAtTime(0.12, now);
  gain3.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
  osc3.connect(gain3);
  gain3.connect(audioContext.destination);
  
  // Start and stop oscillators
  osc1.start(now);
  osc2.start(now);
  osc3.start(now);
  
  osc1.stop(now + 3.5);
  osc2.stop(now + 2.5);
  osc3.stop(now + 2);
}

export function useBellSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext - must be called from a user gesture on iOS
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Unlock AudioContext for iOS - call this SYNCHRONOUSLY from a user gesture
  const unlockAudio = useCallback(() => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') {
      // Create and immediately stop a silent buffer to "unlock" audio on iOS
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      source.stop(0);
      ctx.resume();
    }
    return ctx;
  }, [initAudioContext]);

  const playBell = useCallback(() => {
    try {
      const ctx = initAudioContext();
      
      // Resume if suspended (happens after page interaction requirement)
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          createBellSound(ctx);
        });
      } else {
        createBellSound(ctx);
      }
    } catch (error) {
      console.error('Error playing bell sound:', error);
    }
  }, [initAudioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return { playBell, unlockAudio };
}
