/**
 * Key Points Distiller Agent
 * Currently aggregates only fact distillation results into a single list
 */

import type { PuzzleContext } from './questionValidatorAgent.js';
import {
  distillPuzzleFacts,
  type FactDistillerOptions,
  type FactDistillationResult,
} from './factDistillerAgent.js';

export interface KeyPointsDistillationResult {
  keyPoints: string[];
  facts: FactDistillationResult['facts'];
}

export interface KeyPointsDistillerOptions {
  model: string;
  fallbackModel?: string;
  factModel?: string;
  factFallbackModel?: string;
  factSystemPrompt?: FactDistillerOptions['systemPrompt'];
}

/**
 * Distill key points by combining connection and fact distillers.
 * This coordinator does not call the LLM directly.
 */
export async function distillPuzzleKeyPoints(
  context: PuzzleContext,
  modelOrOptions: string | KeyPointsDistillerOptions,
  fallbackModel?: string
): Promise<KeyPointsDistillationResult> {
  const options: KeyPointsDistillerOptions =
    typeof modelOrOptions === 'string' ? { model: modelOrOptions, fallbackModel } : modelOrOptions;

  if (!options || !options.model) {
    throw new Error('Key points distiller agent requires a model to be specified.');
  }

  const factOptions: FactDistillerOptions = {
    model: options.factModel ?? options.model,
    fallbackModel: options.factFallbackModel ?? options.fallbackModel,
    systemPrompt: options.factSystemPrompt,
  };

  console.log('\n[Key Points Distiller Agent]');

  const factResult = await distillPuzzleFacts(context.truth, factOptions);

  const keyPoints = [...factResult.facts];

  return {
    keyPoints,
    facts: factResult.facts,
  };
}
