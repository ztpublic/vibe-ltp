/**
 * Key Points Distiller Agent
 * Combines connection and fact distillation results into a single list
 */

import type { PuzzleContext } from './questionValidatorAgent.js';
import {
  distillPuzzleConnections,
  type ConnectionDistillerOptions,
  type ConnectionDistillationResult,
} from './connectionDistillerAgent.js';
import {
  distillPuzzleFacts,
  type FactDistillerOptions,
  type FactDistillationResult,
} from './factDistillerAgent.js';

export interface KeyPointsDistillationResult {
  keyPoints: string[];
  connections: ConnectionDistillationResult['connections'];
  facts: FactDistillationResult['facts'];
}

export interface KeyPointsDistillerOptions {
  model: string;
  fallbackModel?: string;
  connectionModel?: string;
  connectionFallbackModel?: string;
  connectionSystemPrompt?: ConnectionDistillerOptions['systemPrompt'];
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

  const connectionOptions: ConnectionDistillerOptions = {
    model: options.connectionModel ?? options.model,
    fallbackModel: options.connectionFallbackModel ?? options.fallbackModel,
    systemPrompt: options.connectionSystemPrompt,
  };

  const factOptions: FactDistillerOptions = {
    model: options.factModel ?? options.model,
    fallbackModel: options.factFallbackModel ?? options.fallbackModel,
    systemPrompt: options.factSystemPrompt,
  };

  console.log('\n[Key Points Distiller Agent]');

  const [connectionResult, factResult] = await Promise.all([
    distillPuzzleConnections(context, connectionOptions),
    distillPuzzleFacts(context.truth, factOptions),
  ]);

  const keyPoints = [...connectionResult.connections, ...factResult.facts];

  return {
    keyPoints,
    connections: connectionResult.connections,
    facts: factResult.facts,
  };
}
