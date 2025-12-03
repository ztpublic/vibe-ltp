/**
 * Truth Validator Agent
 * Evaluates a player's proposed solution against the true story without spoiling it
 */

import { generateText } from 'ai';
import { getOpenRouterClient } from './client.js';
import type { ChatMessage } from './types.js';

export interface TruthValidationInput {
  /** Player-proposed solution text */
  proposedTruth: string;
  /** The actual hidden story */
  actualTruth: string;
  /** Optional puzzle surface to help the model avoid leaking surface details */
  surface?: string;
}

export interface TruthValidationResult {
  feedback: string;
}

export interface TruthValidatorOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
}

export function buildTruthValidatorSystemPrompt(): string {
  return `You are a "truth validator" for a lateral thinking puzzle.

GOAL:
- Compare the player's proposed solution with the true story (汤底).
- Give a short Chinese judgement about how close it is (no spoilers).

OUTPUT RULES:
- Reply with ONE concise paragraph in Chinese that states the closeness and what some key facts are revealed.
- Do NOT give hints about what is missing.
- Do NOT reveal the full truth or key twists.`;
}

function buildContextMessages(input: TruthValidationInput): ChatMessage[] {
  const messages: ChatMessage[] = [];

  if (input.surface) {
    messages.push({
      role: 'assistant',
      content: `PUZZLE SURFACE (汤面):\n${input.surface}`,
    });
  }

  messages.push({
    role: 'assistant',
    content: `PUZZLE TRUTH (汤底):\n${input.actualTruth}`,
  });

  messages.push({
    role: 'assistant',
    content: `PLAYER PROPOSED SOLUTION:\n${input.proposedTruth}`,
  });

  return messages;
}

export async function validateTruthProposal(
  input: TruthValidationInput,
  modelOrOptions: string | TruthValidatorOptions,
  fallbackModel?: string
): Promise<TruthValidationResult> {
  const options: TruthValidatorOptions =
    typeof modelOrOptions === 'string'
      ? { model: modelOrOptions, fallbackModel }
      : modelOrOptions;

  if (!options || !options.model) {
    throw new Error('Truth validator agent requires a model to be specified.');
  }

  if (!input?.proposedTruth || !input.proposedTruth.trim()) {
    throw new Error('Truth validator agent requires a non-empty proposed truth.');
  }

  if (!input?.actualTruth || !input.actualTruth.trim()) {
    throw new Error('Truth validator agent requires the actual truth.');
  }

  const model = options.model;
  const fallbackModelToUse = options.fallbackModel;
  const systemPrompt = options.systemPrompt ?? buildTruthValidatorSystemPrompt();

  const openRouter = getOpenRouterClient();

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...buildContextMessages(input),
  ];

  console.log('\n[Truth Validator Agent]');
  console.log('Proposed truth:', input.proposedTruth);

  const callModel = async (modelToUse: string) => {
    const result = await generateText({
      model: openRouter(modelToUse) as any,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const feedback = (result.text ?? '').trim();

    return {
      feedback: feedback || '未能评估你的解答，请再试一次或提供更多细节。',
    };
  };

  try {
    return await callModel(model);
  } catch (primaryError) {
    if (!fallbackModelToUse) {
      console.error(`❌ Truth validator primary model (${model}) failed and no fallbackModel was provided`);
      throw primaryError;
    }

    console.warn(
      `⚠️ Truth validator primary model (${model}) failed, trying fallback model (${fallbackModelToUse})...`,
      primaryError
    );

    try {
      return await callModel(fallbackModelToUse);
    } catch (fallbackError) {
      console.error('❌ Truth validator: both primary and fallback models failed');
      console.error('Primary error:', primaryError);
      console.error('Fallback error:', fallbackError);

      const primaryMsg = String(primaryError).slice(0, 50);
      const fallbackMsg = String(fallbackError).slice(0, 50);

      throw new Error(`Failed to validate proposed truth: Primary(${primaryMsg}), Fallback(${fallbackMsg})`);
    }
  }
}

export function formatTruthValidationReply(result: TruthValidationResult): string {
  return result.feedback.trim();
}
