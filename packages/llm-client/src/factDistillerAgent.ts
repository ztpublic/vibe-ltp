/**
 * Fact Distiller Agent
 * Extracts 3-5 most important facts from a puzzle truth
 */

import { generateText } from 'ai';
import { createLogger } from '@vibe-ltp/shared';
import { callWithFallbackModel } from './fallback.js';
import { openRouterLanguageModel } from './models.js';
import {
  createDistillFactsTool,
  type DistillFactsArgs,
} from './tools.js';
import type { ChatMessage } from './types.js';

const logger = createLogger({ module: 'factDistiller' });

export interface FactDistillationResult {
  facts: string[];
}

export interface FactDistillerOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
}

export function buildFactDistillerSystemPrompt(): string {
  return `You are a lateral thinking puzzle "fact distiller".

ROLE:
- You see the full hidden truth (汤底).
- Extract 3-5 critical factual statements that anchor the story.

FACT RULES:
- 3-5 facts, each a concise standalone statement in Chinese (no numbering).
- Prioritize causal pivots, key roles, and events that make the truth understandable.
- Avoid spoilers of twists; keep details precise but not exhaustive.
- Do not copy the surface; focus on the truth's substance.

OUTPUT FORMAT:
You MUST respond ONLY by calling the tool "distill_facts" with the array of fact strings.`;
}

function buildContextMessages(truth: string): ChatMessage[] {
  return [
    {
      role: 'assistant',
      content: `PUZZLE TRUTH (汤底):\n${truth}`,
    },
  ];
}

export async function distillPuzzleFacts(
  truth: string,
  modelOrOptions: string | FactDistillerOptions,
  fallbackModel?: string
): Promise<FactDistillationResult> {
  const options: FactDistillerOptions =
    typeof modelOrOptions === 'string' ? { model: modelOrOptions, fallbackModel } : modelOrOptions;

  if (!options || !options.model) {
    throw new Error('Fact distiller agent requires a model to be specified.');
  }

  const model = options.model;
  const fallbackModelToUse = options.fallbackModel;
  const systemPrompt = options.systemPrompt ?? buildFactDistillerSystemPrompt();

  const distillTool = createDistillFactsTool();

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...buildContextMessages(truth),
  ];

  const aiTools = {
    [distillTool.name]: {
      description: distillTool.description,
      parameters: distillTool.parameters,
    },
  };

  logger.info('[Fact Distiller Agent]');

  const callModel = async (modelToUse: string) => {
    const result = await generateText({
      model: openRouterLanguageModel(modelToUse),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      tools: aiTools,
      maxSteps: 1,
    });

    if (result.toolCalls && result.toolCalls.length > 0) {
      const toolCall = result.toolCalls[0];
      if (toolCall) {
        const args = toolCall.args as DistillFactsArgs;
        return { facts: args.facts };
      }
    }

    logger.warn('No tool call returned; defaulting to empty facts.');
    return { facts: [] };
  };

  return callWithFallbackModel({
    operation: 'distill puzzle facts',
    model,
    fallbackModel: fallbackModelToUse,
    call: callModel,
  });
}
