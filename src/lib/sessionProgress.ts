/**
 * Session Progress Utilities
 * Sprint: Completion Logic Refactor
 * 
 * Validates the new structured data schema for morning and night sessions.
 */
import { DailySession } from '@/hooks/useDailySession';

export interface MorningProgressState {
  quoteAbsorbed: boolean;
  hasIntention: boolean;
  hasClarityLevel: boolean;
  hasCriticalAction: boolean;
  hasActionCategory: boolean;
  hasGratitudeCategory: boolean;
}

export interface NightProgressState {
  hasEmotionalZone: boolean;
  hasEveningEnergy: boolean;
  hasPresenceScore: boolean;
  actionStatusSet: boolean;
  hasFailureReasonIfNeeded: boolean;
  hasDailyWin: boolean;
  hasDailyLoss: boolean;
  hasNightGratitude: boolean;
}

export interface MorningProgress {
  steps: MorningProgressState;
  completedCount: number;
  totalSteps: number;
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
}

export interface NightProgress {
  steps: NightProgressState;
  completedCount: number;
  totalSteps: number;
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
}

/**
 * Calculate morning session completion based on new structured fields
 * 
 * Required fields:
 * - quote_absorbed: TRUE
 * - main_intention: NOT NULL and length > 0
 * - clarity_level: selected (value > 0)
 * - critical_action + action_category: both present
 * - morning_gratitude_category: selected
 */
export function calculateMorningProgress(
  session: DailySession | null,
  localState?: {
    criticalAction?: string;
    identity?: string;
  }
): MorningProgress {
  const missingFields: string[] = [];
  
  const quoteAbsorbed = session?.quote_absorbed ?? false;
  if (!quoteAbsorbed) missingFields.push('Confirme a leitura do quote');
  
  const hasIntention = !!(session?.main_intention && session.main_intention.trim().length > 0);
  if (!hasIntention) missingFields.push('Defina sua intenção principal');
  
  const hasClarityLevel = !!(session?.clarity_level && session.clarity_level > 0);
  if (!hasClarityLevel) missingFields.push('Avalie o nível de clareza');
  
  // Critical action can come from local state or legacy daily_entries
  const hasCriticalAction = !!(localState?.criticalAction && localState.criticalAction.trim().length > 0);
  if (!hasCriticalAction) missingFields.push('Defina a ação crítica');
  
  const hasActionCategory = !!session?.action_category;
  if (!hasActionCategory) missingFields.push('Selecione a categoria da ação');
  
  const hasGratitudeCategory = !!session?.morning_gratitude_category;
  if (!hasGratitudeCategory) missingFields.push('Selecione uma categoria de gratidão');

  const steps: MorningProgressState = {
    quoteAbsorbed,
    hasIntention,
    hasClarityLevel,
    hasCriticalAction,
    hasActionCategory,
    hasGratitudeCategory,
  };

  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;
  const percentage = Math.round((completedCount / totalSteps) * 100);
  const isComplete = completedCount === totalSteps;

  return {
    steps,
    completedCount,
    totalSteps,
    percentage,
    isComplete,
    missingFields,
  };
}

/**
 * Calculate night session completion based on new structured fields
 * 
 * Required fields:
 * - emotional_zone: selected
 * - evening_energy: selected (always has a value via slider)
 * - presence_score: set
 * - critical_action_completed: set (true/false)
 *   - IF false: failure_reason MUST be present
 * - daily_win: NOT NULL
 * - daily_loss: NOT NULL
 * - night_gratitude_text: present
 */
export function calculateNightProgress(
  session: DailySession | null,
  localState: {
    eveningEnergy: number;
    emotionalZone: string | null;
    presenceScore: number | null;
    actionDone: boolean;
    failureReason: string | null;
    dailyWin: string;
    dailyLoss: string;
    nightGratitudeText: string;
  }
): NightProgress {
  const missingFields: string[] = [];
  
  const hasEmotionalZone = !!localState.emotionalZone;
  if (!hasEmotionalZone) missingFields.push('Selecione a zona emocional');
  
  // Evening energy is always set via slider (default 5)
  const hasEveningEnergy = localState.eveningEnergy !== null && localState.eveningEnergy !== undefined;
  
  const hasPresenceScore = localState.presenceScore !== null;
  if (!hasPresenceScore) missingFields.push('Defina o nível de presença');
  
  // Action status is always set (button click sets true or false)
  const actionStatusSet = true;
  
  // Failure reason required only when action is NOT done
  const hasFailureReasonIfNeeded = localState.actionDone || !!localState.failureReason;
  if (!hasFailureReasonIfNeeded) missingFields.push('Selecione o motivo do não cumprimento');
  
  const hasDailyWin = !!(localState.dailyWin && localState.dailyWin.trim().length >= 5);
  if (!hasDailyWin) missingFields.push('Descreva a vitória do dia (mín. 5 chars)');
  
  const hasDailyLoss = !!(localState.dailyLoss && localState.dailyLoss.trim().length > 0);
  if (!hasDailyLoss) missingFields.push('Descreva onde falhou');
  
  const hasNightGratitude = !!(localState.nightGratitudeText && localState.nightGratitudeText.trim().length > 0);
  if (!hasNightGratitude) missingFields.push('Registre a gratidão de fechamento');

  const steps: NightProgressState = {
    hasEmotionalZone,
    hasEveningEnergy,
    hasPresenceScore,
    actionStatusSet,
    hasFailureReasonIfNeeded,
    hasDailyWin,
    hasDailyLoss,
    hasNightGratitude,
  };

  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;
  const percentage = Math.round((completedCount / totalSteps) * 100);
  const isComplete = completedCount === totalSteps;

  return {
    steps,
    completedCount,
    totalSteps,
    percentage,
    isComplete,
    missingFields,
  };
}
