/**
 * Dynamic Prompts Engine
 * Sprint: Core Habit Loop + SOS + Chips + Focus Mode + Dynamic Prompts
 * 
 * Rule-based prompts to reduce "blank page" friction.
 * Only 4 conditions as specified - no additional branches.
 */

export interface DynamicPromptContext {
  mood: string | null;
  emotion: string | null;
  energy: number | null;
}

// Default placeholders
const DEFAULT_PROMPTS = {
  autopilot: 'Onde você operou no automático?',
  action: 'Uma pausa consciente que você fez',
  morningAction: 'Qual ação curta aumenta seu momentum?',
};

/**
 * Get dynamic placeholder for Auto-piloto field in Night checkout
 */
export function getAutopilotPrompt(ctx: DynamicPromptContext): string {
  // Rule 1: If mood is ansioso OR emotion is medo
  if (ctx.mood === 'ansioso' || ctx.emotion === 'medo') {
    return 'O que está fora do seu controle aqui? O que você pode soltar hoje?';
  }
  
  return DEFAULT_PROMPTS.autopilot;
}

/**
 * Get dynamic placeholder for 1 ação field
 */
export function getActionPrompt(ctx: DynamicPromptContext): string {
  // Rule 3: If mood is focado OR emotion is entusiasmo (morning)
  if (ctx.mood === 'focado' || ctx.emotion === 'entusiasmo') {
    return 'Qual ação curta aumenta seu momentum?';
  }
  
  return DEFAULT_PROMPTS.action;
}

/**
 * Check if "low energy" helper should be shown
 * Rule 2: If mood is cansado OR sobrecarregado OR energy <= 4
 */
export function shouldShowMinimalActionHelper(ctx: DynamicPromptContext): boolean {
  if (ctx.mood === 'cansado' || ctx.mood === 'sobrecarregado') {
    return true;
  }
  if (ctx.energy !== null && ctx.energy <= 4) {
    return true;
  }
  return false;
}

/**
 * Get the minimal action placeholder when low energy is detected
 */
export function getMinimalActionPrompt(): string {
  return 'A menor ação possível (2 min)';
}

/**
 * Get the helper text for minimal action
 */
export function getMinimalActionHelperText(): string {
  return 'Mínimo viável: uma ação de 2 minutos.';
}
