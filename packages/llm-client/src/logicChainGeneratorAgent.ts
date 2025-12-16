/**
 * Logic Chain Generator Agent
 * Produces a progressive chain of reasoning steps from surface toward truth
 */

import { generateText } from 'ai';
import { createLogger } from '@vibe-ltp/shared';
import { callWithFallbackModel } from './fallback.js';
import { openRouterLanguageModel } from './models.js';
import {
  createDistillLogicChainTool,
  type DistillLogicChainArgs,
} from './tools.js';
import type { PuzzleContext } from './questionValidatorAgent.js';
import type { ChatMessage } from './types.js';

const logger = createLogger({ module: 'logicChainGenerator' });

export interface LogicChainResult {
  chain: string[];
}

export interface LogicChainGeneratorOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
}

/**
 * Build the system prompt for the logic chain generator agent
 */
export function buildLogicChainSystemPrompt(): string {
  return `You are a lateral thinking puzzle "logic chain generator".

ROLE:
- Players only see the puzzle surface. You also know the hidden truth.
- Your job is to produce a progressive chain of reasoning steps ("links") that connect the surface toward the truth without revealing it outright.

LOGIC CHAIN RULES:
- 3-5 links total. Each link must be a single clear statement in Chinese (no numbering).
- Link 1: can be inferred directly from the surface alone.
- Link 2: can be inferred from the surface + Link 1.
- Link 3: can be inferred from the surface + Links 1-2. Continue similarly for any additional links.
- Each link must depend on the previous ones; no leaps or independent facts.
- Avoid spoilers of the full truth; no character names or explicit endings.
- Prefer facts players could plausibly confirm through questioning.

OUTPUT FORMAT:
You MUST respond ONLY by calling the tool "distill_logic_chain" with the array of link strings.`;
}

function buildContextMessages(context: PuzzleContext): ChatMessage[] {
  const messages: ChatMessage[] = [];

  messages.push({
    role: 'assistant',
    content: `PUZZLE SURFACE (汤面):\n${context.surface}`,
  });

  messages.push({
    role: 'assistant',
    content: `PUZZLE TRUTH (汤底):\n${context.truth}`,
  });

  if (context.conversationHistory.length > 0) {
    const recentHistory = context.conversationHistory.slice(-10);
    const historyText = recentHistory.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');

    messages.push({
      role: 'assistant',
      content: `RECENT CONVERSATION HISTORY (latest 10):\n${historyText}`,
    });
  }

  return messages;
}

/**
 * Generate a progressive logic chain for a puzzle context
 */
export async function distillPuzzleLogicChain(
  context: PuzzleContext,
  modelOrOptions: string | LogicChainGeneratorOptions,
  fallbackModel?: string
): Promise<LogicChainResult> {
  const options: LogicChainGeneratorOptions =
    typeof modelOrOptions === 'string' ? { model: modelOrOptions, fallbackModel } : modelOrOptions;

  if (!options || !options.model) {
    throw new Error('Logic chain generator requires a model to be specified.');
  }

  const model = options.model;
  const fallbackModelToUse = options.fallbackModel;
  const systemPrompt = options.systemPrompt ?? buildLogicChainSystemPrompt();

  const logicChainTool = createDistillLogicChainTool();

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...buildContextMessages(context),
  ];

  const aiTools = {
    [logicChainTool.name]: {
      description: logicChainTool.description,
      parameters: logicChainTool.parameters,
    },
  };

  logger.info('[Logic Chain Generator]');

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
        const args = toolCall.args as DistillLogicChainArgs;
        return { chain: args.chain };
      }
    }

    logger.warn('No tool call returned; defaulting to empty logic chain.');
    return { chain: [] };
  };

  return callWithFallbackModel({
    operation: 'generate logic chain',
    model,
    fallbackModel: fallbackModelToUse,
    call: callModel,
  });
}
