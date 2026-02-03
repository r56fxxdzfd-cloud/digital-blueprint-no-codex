export interface Theme {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Visualization {
  id: string;
  theme_id: string;
  title: string;
  script: string;
  duration_min: number;
  energy_min: number;
  energy_max: number;
  tags: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyEntry {
  id: string;
  date: string;
  theme_id: string | null;
  visualization_id: string | null;
  energy: number | null;
  identity: string | null;
  critical_action: string | null;
  action_done: boolean;
  evidence: string | null;
  autopilot: string | null;
  tomorrow_adjustment: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReview {
  id: string;
  week_start_date: string;
  theme_id: string | null;
  wins: string | null;
  hard_truth: string | null;
  self_deception_pattern: string | null;
  bottleneck_habit: string | null;
  one_action: string | null;
  stop_rule: string | null;
  score_0_10: number | null;
  // Sprint: Weekly Refactor - Start/Stop/Continue
  strategy_start: string | null;
  strategy_stop: string | null;
  strategy_continue: string | null;
  next_week_identity: string | null;
  next_week_goal: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  default_theme_mode: 'auto' | 'manual';
  no_repeat_days: number;
  preferred_duration_min: number;
  theme_lookback_days: number;
  // TTS Core
  tts_enabled: boolean;
  tts_rate: number;
  tts_pitch: number;
  tts_volume: number;
  tts_prefer_female: boolean;
  tts_voice_uri: string | null;
  // TTS Pauses (legacy - kept for compatibility)
  tts_sentence_pause_ms: number;
  tts_paragraph_pause_ms: number;
  tts_max_chunk_chars: number;
  tts_pause_ms_comma: number;
  tts_pause_ms_ellipsis: number;
  tts_pause_multiplier: number;
  // TTS Duration Targets
  tts_target_total_ms: number;
  tts_target_min_ms: number;
  tts_target_max_ms: number;
  tts_fill_mode: 'none' | 'fill_to_target';
  tts_end_silence_ms: number;
  // Micro-chunking pacing
  tts_pause_base_ms: number;
  tts_pause_per_word_ms: number;
  tts_pause_sentence_extra_ms: number;
  tts_pause_paragraph_extra_ms: number;
  tts_breath_pause_ms: number;
  tts_microchunk_min_words: number;
  tts_microchunk_max_words: number;
  // Outro (guided closing)
  tts_outro_enabled: boolean;
  tts_outro_text: string;
  created_at: string;
  updated_at: string;
}
