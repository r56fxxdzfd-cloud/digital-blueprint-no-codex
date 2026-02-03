import { useState, useEffect, useCallback, useRef } from 'react';

// ============= Types =============

export interface TTSSettings {
  tts_enabled: boolean;
  tts_rate: number;
  tts_pitch: number;
  tts_volume: number;
  tts_prefer_female: boolean;
  tts_voice_uri: string | null;
  // Micro-chunking pacing
  tts_pause_base_ms: number;
  tts_pause_per_word_ms: number;
  tts_pause_sentence_extra_ms: number;
  tts_pause_paragraph_extra_ms: number;
  tts_breath_pause_ms: number;
  tts_microchunk_min_words: number;
  tts_microchunk_max_words: number;
  // Duration targets
  tts_end_silence_ms: number;
  // Outro
  tts_outro_enabled: boolean;
  tts_outro_text: string;
  // Legacy (kept for compatibility but not used in new pipeline)
  tts_sentence_pause_ms?: number;
  tts_paragraph_pause_ms?: number;
  tts_max_chunk_chars?: number;
  tts_pause_ms_comma?: number;
  tts_pause_ms_ellipsis?: number;
  tts_pause_multiplier?: number;
  tts_target_total_ms?: number;
  tts_target_min_ms?: number;
  tts_target_max_ms?: number;
  tts_fill_mode?: 'none' | 'fill_to_target';
}

export interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string | null;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  currentChunkIndex: number;
  totalChunks: number;
  estimatedDurationMs: number;
  isInEndSilence: boolean;
  endSilenceRemainingMs: number;
  currentRate: number;
}

// MicroChunk with boundary type
interface MicroChunk {
  text: string;
  wordCount: number;
  boundary: 'none' | 'sentence' | 'paragraph' | 'ellipsis' | 'breath' | 'final';
}

const DEFAULT_OUTRO_TEXT = `Agora… fique em silêncio… e apenas sinta…

Se pensamentos vierem… deixe passar…

Quando desejar… traga atenção para o corpo…

sentindo os pés… as mãos… e a respiração…

E volte devagar… abrindo os olhos no seu tempo.`;

const DEFAULT_SETTINGS: TTSSettings = {
  tts_enabled: true,
  tts_rate: 0.62,
  tts_pitch: 1.0,
  tts_volume: 1.0,
  tts_prefer_female: true,
  tts_voice_uri: null,
  // Micro-chunking defaults
  tts_pause_base_ms: 220,
  tts_pause_per_word_ms: 65,
  tts_pause_sentence_extra_ms: 450,
  tts_pause_paragraph_extra_ms: 900,
  tts_breath_pause_ms: 1700,
  tts_microchunk_min_words: 8,
  tts_microchunk_max_words: 14,
  tts_end_silence_ms: 30000,
  // Outro defaults
  tts_outro_enabled: true,
  tts_outro_text: DEFAULT_OUTRO_TEXT,
};

// ============= Voice Selection =============

const FEMALE_PATTERNS = [
  'female', 'feminina', 'mulher', 'woman',
  'luciana', 'maria', 'ana', 'julia', 'camila', 'fernanda',
  'google brasileiro', 'microsoft maria', 'samantha', 'victoria',
  'karen', 'monica', 'paulina', 'joana', 'ines', 'catarina'
];

function isLikelyFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return FEMALE_PATTERNS.some(pattern => name.includes(pattern));
}

function selectBestVoice(
  voices: SpeechSynthesisVoice[],
  preferFemale: boolean,
  preferredUri: string | null
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  if (preferredUri) {
    const preferred = voices.find(v => v.voiceURI === preferredUri);
    if (preferred) return preferred;
  }

  const langPriorities = ['pt-BR', 'pt-PT', 'pt'];
  let candidates: SpeechSynthesisVoice[] = [];
  
  for (const lang of langPriorities) {
    candidates = voices.filter(v => 
      v.lang.toLowerCase().startsWith(lang.toLowerCase())
    );
    if (candidates.length > 0) break;
  }
  
  if (candidates.length === 0) {
    candidates = voices;
  }

  if (preferFemale) {
    const femaleVoices = candidates.filter(isLikelyFemaleVoice);
    if (femaleVoices.length > 0) {
      return femaleVoices[0];
    }
  }

  return candidates[0];
}

// ============= Text Tokenization =============

const PARAGRAPH_TOKEN = '___PARAGRAPH___';

/**
 * Tokenize text into words, preserving punctuation attached to words
 * and marking paragraph breaks as special tokens
 */
function tokenize(text: string): string[] {
  // Normalize whitespace and mark paragraph breaks
  let processed = text.replace(/\n\s*\n+/g, ` ${PARAGRAPH_TOKEN} `);
  processed = processed.replace(/\n/g, ' ');
  processed = processed.replace(/\s+/g, ' ').trim();
  
  // Split into tokens (words with attached punctuation)
  const tokens = processed.split(' ').filter(t => t.length > 0);
  
  return tokens;
}

/**
 * Determine boundary type from last token in a chunk
 */
function getBoundaryType(lastToken: string, nextToken: string | null): MicroChunk['boundary'] {
  if (nextToken === PARAGRAPH_TOKEN || lastToken === PARAGRAPH_TOKEN) {
    return 'paragraph';
  }
  
  // Check for ellipsis
  if (lastToken.endsWith('...') || lastToken.endsWith('…')) {
    return 'ellipsis';
  }
  
  // Check for sentence end
  if (/[.!?]$/.test(lastToken)) {
    return 'sentence';
  }
  
  return 'none';
}

/**
 * Build micro-chunks from tokens
 * Each chunk has 8-14 words (configurable), respecting sentence/paragraph boundaries
 */
function buildMicroChunks(
  tokens: string[],
  minWords: number,
  maxWords: number
): MicroChunk[] {
  const chunks: MicroChunk[] = [];
  let currentWords: string[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1] ?? null;
    
    // Skip paragraph tokens but mark boundary
    if (token === PARAGRAPH_TOKEN) {
      if (currentWords.length > 0) {
        chunks.push({
          text: currentWords.join(' '),
          wordCount: currentWords.length,
          boundary: 'paragraph',
        });
        currentWords = [];
      }
      continue;
    }
    
    currentWords.push(token);
    
    const wordCount = currentWords.length;
    const boundary = getBoundaryType(token, nextToken);
    
    // Decide when to close chunk
    const shouldClose = 
      // Max words reached
      wordCount >= maxWords ||
      // Paragraph break coming next
      nextToken === PARAGRAPH_TOKEN ||
      // Sentence/ellipsis end and we're at or past min words
      (wordCount >= minWords && (boundary === 'sentence' || boundary === 'ellipsis')) ||
      // Last token
      i === tokens.length - 1;
    
    if (shouldClose && currentWords.length > 0) {
      chunks.push({
        text: currentWords.join(' '),
        wordCount: currentWords.length,
        boundary: boundary === 'none' && nextToken === null ? 'sentence' : boundary,
      });
      currentWords = [];
    }
  }
  
  // Handle any remaining words
  if (currentWords.length > 0) {
    chunks.push({
      text: currentWords.join(' '),
      wordCount: currentWords.length,
      boundary: 'sentence',
    });
  }
  
  return chunks;
}

/**
 * Compute delay after a chunk based on word count and boundary
 * Returns 0 for 'final' boundary - no delay after the last chunk
 */
function computeDelay(chunk: MicroChunk, settings: TTSSettings): number {
  // No delay after the final chunk
  if (chunk.boundary === 'final') {
    return 0;
  }
  
  // Base delay + per-word delay
  let delay = settings.tts_pause_base_ms + (chunk.wordCount * settings.tts_pause_per_word_ms);
  
  // Add extras based on boundary type
  switch (chunk.boundary) {
    case 'paragraph':
      delay += settings.tts_pause_paragraph_extra_ms;
      break;
    case 'sentence':
      delay += settings.tts_pause_sentence_extra_ms;
      break;
    case 'ellipsis':
      delay += settings.tts_pause_sentence_extra_ms; // Same as sentence
      break;
    case 'breath':
      delay = settings.tts_breath_pause_ms;
      break;
  }
  
  // Clamp to reasonable range (150ms - 3500ms)
  return Math.max(150, Math.min(3500, delay));
}

/**
 * Create intro chunks for meditation start sequence
 */
function createIntroChunks(title: string, settings: TTSSettings): MicroChunk[] {
  return [
    { text: `Visualização: ${title}.`, wordCount: 2, boundary: 'breath' },
    { text: 'Três respirações profundas.', wordCount: 3, boundary: 'breath' },
    // Three breath pauses (silent chunks)
    { text: '', wordCount: 0, boundary: 'breath' },
    { text: '', wordCount: 0, boundary: 'breath' },
    { text: '', wordCount: 0, boundary: 'breath' },
  ];
}

/**
 * Estimate total duration for chunks
 */
function estimateTotalDuration(
  chunks: MicroChunk[],
  settings: TTSSettings
): { speechMs: number; pauseMs: number; totalMs: number } {
  let speechMs = 0;
  let pauseMs = 0;
  
  // Estimate WPM based on rate (base ~140 WPM at rate 1.0)
  const effectiveWpm = 140 * settings.tts_rate;
  
  chunks.forEach((chunk, index) => {
    if (chunk.text) {
      // Speech time
      speechMs += (chunk.wordCount / effectiveWpm) * 60 * 1000;
    }
    
    // Pause time (no delay after final chunk)
    if (chunk.boundary !== 'final') {
      pauseMs += computeDelay(chunk, settings);
    }
  });
  
  return {
    speechMs,
    pauseMs,
    totalMs: speechMs + pauseMs + settings.tts_end_silence_ms,
  };
}

// ============= Main Hook =============

export interface UseTTSOptions {
  settings?: Partial<TTSSettings>;
  onEndSilenceComplete?: () => void;
}

export function useTTS(options: UseTTSOptions = {}) {
  const { settings = {}, onEndSilenceComplete } = options;
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  const onEndSilenceCompleteRef = useRef(onEndSilenceComplete);
  
  // Keep ref updated
  useEffect(() => {
    onEndSilenceCompleteRef.current = onEndSilenceComplete;
  }, [onEndSilenceComplete]);
  
  const [state, setState] = useState<TTSState>({
    isSpeaking: false,
    isPaused: false,
    currentText: null,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    voices: [],
    selectedVoice: null,
    currentChunkIndex: 0,
    totalChunks: 0,
    estimatedDurationMs: 0,
    isInEndSilence: false,
    endSilenceRemainingMs: 0,
    currentRate: mergedSettings.tts_rate,
  });

  const chunksRef = useRef<MicroChunk[]>([]);
  const currentIndexRef = useRef<number>(0);
  const isStoppedRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const endSilenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const endSilenceStartRef = useRef<number>(0);
  const endSilenceTotalRef = useRef<number>(0);
  const endSilenceElapsedRef = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);
  const remainingDelayRef = useRef<number>(0);

  // Load voices
  useEffect(() => {
    if (!state.isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        const bestVoice = selectBestVoice(
          availableVoices,
          mergedSettings.tts_prefer_female,
          mergedSettings.tts_voice_uri
        );
        setState(prev => ({
          ...prev,
          voices: availableVoices,
          selectedVoice: bestVoice,
        }));
      }
    };

    loadVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [state.isSupported, mergedSettings.tts_prefer_female, mergedSettings.tts_voice_uri]);

  // Update selected voice when settings change
  useEffect(() => {
    if (state.voices.length > 0) {
      const bestVoice = selectBestVoice(
        state.voices,
        mergedSettings.tts_prefer_female,
        mergedSettings.tts_voice_uri
      );
      setState(prev => ({ ...prev, selectedVoice: bestVoice }));
    }
  }, [mergedSettings.tts_prefer_female, mergedSettings.tts_voice_uri, state.voices]);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (endSilenceIntervalRef.current) {
      clearInterval(endSilenceIntervalRef.current);
      endSilenceIntervalRef.current = null;
    }
    pausedAtRef.current = null;
    remainingDelayRef.current = 0;
    endSilenceStartRef.current = 0;
    endSilenceTotalRef.current = 0;
    endSilenceElapsedRef.current = 0;
  }, []);

  const finishSession = useCallback((fromEndSilence: boolean = false) => {
    clearAllTimers();
    chunksRef.current = [];
    currentIndexRef.current = 0;
    
    // Play bell sound when end silence completes naturally (not skipped/stopped)
    if (fromEndSilence && onEndSilenceCompleteRef.current) {
      onEndSilenceCompleteRef.current();
    }
    
    setState(prev => ({
      ...prev,
      isSpeaking: false,
      isPaused: false,
      currentText: null,
      currentChunkIndex: 0,
      totalChunks: 0,
      estimatedDurationMs: 0,
      isInEndSilence: false,
      endSilenceRemainingMs: 0,
    }));
  }, [clearAllTimers]);

  const stop = useCallback(() => {
    if (!state.isSupported) return;
    
    isStoppedRef.current = true;
    isPausedRef.current = false;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    finishSession();
  }, [state.isSupported, finishSession]);

  const skipEndSilence = useCallback(() => {
    if (state.isInEndSilence) {
      finishSession();
    }
  }, [state.isInEndSilence, finishSession]);

  const startEndSilence = useCallback((totalMs: number) => {
    if (isStoppedRef.current || totalMs <= 0) {
      finishSession();
      return;
    }

    endSilenceTotalRef.current = totalMs;
    endSilenceElapsedRef.current = 0;
    endSilenceStartRef.current = Date.now();
    
    setState(prev => ({
      ...prev,
      isInEndSilence: true,
      endSilenceRemainingMs: totalMs,
    }));

    // Update countdown every 250ms
    endSilenceIntervalRef.current = setInterval(() => {
      if (isStoppedRef.current) {
        clearInterval(endSilenceIntervalRef.current!);
        return;
      }
      
      if (!isPausedRef.current) {
        const elapsed = Date.now() - endSilenceStartRef.current + endSilenceElapsedRef.current;
        const remaining = Math.max(0, endSilenceTotalRef.current - elapsed + endSilenceElapsedRef.current);
        
        // Recalculate based on running time
        const actualElapsed = Date.now() - endSilenceStartRef.current;
        const actualRemaining = Math.max(0, endSilenceTotalRef.current - actualElapsed);
        
        setState(prev => ({
          ...prev,
          endSilenceRemainingMs: actualRemaining,
        }));

        if (actualRemaining <= 0) {
          finishSession(true); // true = from end silence completion, triggers bell
        }
      }
    }, 250);
  }, [finishSession]);

  const speakChunk = useCallback((index: number) => {
    if (isStoppedRef.current || isPausedRef.current) return;
    
    if (index >= chunksRef.current.length) {
      // All chunks done - immediately start end silence (no extra delay)
      startEndSilence(mergedSettings.tts_end_silence_ms);
      return;
    }

    const chunk = chunksRef.current[index];
    currentIndexRef.current = index;
    
    setState(prev => ({
      ...prev,
      currentChunkIndex: index,
      isInEndSilence: false,
    }));
    
    // If chunk has no text (breath pause), just wait
    if (!chunk.text) {
      const delay = computeDelay(chunk, mergedSettings);
      timeoutRef.current = setTimeout(() => {
        if (!isStoppedRef.current && !isPausedRef.current) {
          speakChunk(index + 1);
        }
      }, delay);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    
    utterance.rate = mergedSettings.tts_rate;
    utterance.pitch = mergedSettings.tts_pitch;
    utterance.volume = mergedSettings.tts_volume;
    
    if (state.selectedVoice) {
      utterance.voice = state.selectedVoice;
    }

    utterance.onend = () => {
      if (isStoppedRef.current) return;
      
      // For the final chunk, no delay - go straight to end silence
      if (chunk.boundary === 'final') {
        startEndSilence(mergedSettings.tts_end_silence_ms);
        return;
      }
      
      const delay = computeDelay(chunk, mergedSettings);
      
      // Store delay info for potential pause
      remainingDelayRef.current = delay;
      pausedAtRef.current = Date.now();
      
      timeoutRef.current = setTimeout(() => {
        if (!isStoppedRef.current && !isPausedRef.current) {
          speakChunk(index + 1);
        }
      }, delay);
    };

    utterance.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') {
        return;
      }
      console.error('TTS Error:', event.error);
      finishSession();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [mergedSettings, state.selectedVoice, startEndSilence, finishSession]);

  const speak = useCallback((text: string, title?: string) => {
    if (!state.isSupported || !mergedSettings.tts_enabled) return;

    // Cancel any pending speech first
    window.speechSynthesis.cancel();
    clearAllTimers();
    
    isStoppedRef.current = false;
    isPausedRef.current = false;

    // iOS Safari workaround: "unlock" speech synthesis with an empty utterance
    // This must happen SYNCHRONOUSLY within the user gesture context
    const unlockUtterance = new SpeechSynthesisUtterance('');
    unlockUtterance.volume = 0;
    window.speechSynthesis.speak(unlockUtterance);

    // Build full text with outro if enabled
    let fullScriptText = text;
    if (mergedSettings.tts_outro_enabled && mergedSettings.tts_outro_text) {
      fullScriptText = text + '\n\n' + mergedSettings.tts_outro_text;
    }

    // Tokenize and build chunks
    const tokens = tokenize(fullScriptText);
    const scriptChunks = buildMicroChunks(
      tokens,
      mergedSettings.tts_microchunk_min_words,
      mergedSettings.tts_microchunk_max_words
    );
    
    // Mark the last chunk as FINAL (no delay after it)
    if (scriptChunks.length > 0) {
      scriptChunks[scriptChunks.length - 1].boundary = 'final';
    }
    
    // Add intro sequence if title provided
    const introChunks = title ? createIntroChunks(title, mergedSettings) : [];
    const allChunks = [...introChunks, ...scriptChunks];
    
    if (allChunks.length === 0) return;

    chunksRef.current = allChunks;
    currentIndexRef.current = 0;

    // Calculate estimated duration
    const { totalMs } = estimateTotalDuration(allChunks, mergedSettings);

    setState(prev => ({
      ...prev,
      isSpeaking: true,
      currentText: text,
      totalChunks: allChunks.length,
      currentChunkIndex: 0,
      estimatedDurationMs: totalMs,
      currentRate: mergedSettings.tts_rate,
      isInEndSilence: false,
      endSilenceRemainingMs: 0,
    }));

    // Start speaking immediately after unlock utterance
    speakChunk(0);
  }, [state.isSupported, mergedSettings, clearAllTimers, speakChunk]);

  const pause = useCallback(() => {
    if (!state.isSupported || !state.isSpeaking || state.isPaused) return;
    
    isPausedRef.current = true;
    
    // If in end silence, store elapsed time
    if (state.isInEndSilence) {
      endSilenceElapsedRef.current += Date.now() - endSilenceStartRef.current;
    }
    
    // Clear pending timeout and store remaining time
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      
      if (pausedAtRef.current) {
        const elapsed = Date.now() - pausedAtRef.current;
        remainingDelayRef.current = Math.max(0, remainingDelayRef.current - elapsed);
      }
    }
    
    window.speechSynthesis.pause();
    setState(prev => ({ ...prev, isPaused: true }));
  }, [state.isSupported, state.isSpeaking, state.isPaused, state.isInEndSilence]);

  const resume = useCallback(() => {
    if (!state.isSupported || !state.isPaused) return;
    
    isPausedRef.current = false;
    
    // If resuming in end silence, restart the timer with remaining time
    if (state.isInEndSilence) {
      const remaining = state.endSilenceRemainingMs;
      endSilenceStartRef.current = Date.now();
      endSilenceTotalRef.current = remaining;
      endSilenceElapsedRef.current = 0;
    }
    
    window.speechSynthesis.resume();
    
    // Resume with remaining delay if we were in a pause between chunks
    if (remainingDelayRef.current > 0 && !window.speechSynthesis.speaking && !state.isInEndSilence) {
      timeoutRef.current = setTimeout(() => {
        if (!isStoppedRef.current && !isPausedRef.current) {
          speakChunk(currentIndexRef.current + 1);
        }
      }, remainingDelayRef.current);
      remainingDelayRef.current = 0;
    }
    
    setState(prev => ({ ...prev, isPaused: false }));
  }, [state.isSupported, state.isPaused, state.isInEndSilence, state.endSilenceRemainingMs, speakChunk]);

  const togglePause = useCallback(() => {
    if (state.isPaused) {
      resume();
    } else {
      pause();
    }
  }, [state.isPaused, pause, resume]);

  /**
   * Estimate duration for a given script (without speaking)
   */
  const estimateScriptDuration = useCallback((script: string, title?: string): {
    totalMs: number;
    speechMs: number;
    pauseMs: number;
    wordCount: number;
    chunkCount: number;
    isShort: boolean;
  } => {
    // Include outro in estimation if enabled
    let fullScript = script;
    if (mergedSettings.tts_outro_enabled && mergedSettings.tts_outro_text) {
      fullScript = script + '\n\n' + mergedSettings.tts_outro_text;
    }
    
    const tokens = tokenize(fullScript);
    const scriptChunks = buildMicroChunks(
      tokens,
      mergedSettings.tts_microchunk_min_words,
      mergedSettings.tts_microchunk_max_words
    );
    
    // Mark final chunk
    if (scriptChunks.length > 0) {
      scriptChunks[scriptChunks.length - 1].boundary = 'final';
    }
    
    const introChunks = title ? createIntroChunks(title, mergedSettings) : [];
    const allChunks = [...introChunks, ...scriptChunks];
    
    const { totalMs, speechMs, pauseMs } = estimateTotalDuration(allChunks, mergedSettings);
    const wordCount = tokens.filter(t => t !== PARAGRAPH_TOKEN).length;
    
    return {
      totalMs,
      speechMs,
      pauseMs,
      wordCount,
      chunkCount: allChunks.length,
      isShort: wordCount < 180,
    };
  }, [mergedSettings]);

  return {
    ...state,
    speak,
    pause,
    resume,
    stop,
    togglePause,
    skipEndSilence,
    estimateScriptDuration,
    settings: mergedSettings,
  };
}

export function getVoiceDisplayName(voice: SpeechSynthesisVoice): string {
  return `${voice.name} (${voice.lang})`;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec}s`;
}

export { DEFAULT_OUTRO_TEXT };
