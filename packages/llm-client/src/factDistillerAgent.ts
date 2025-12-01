/**
 * Fact Distiller Agent
 * Extracts 3-5 most important facts from a puzzle truth
 */

import { generateText } from 'ai';
import { getOpenRouterClient } from './client.js';
import {
  createDistillFactsTool,
  DistillFactsArgsSchema,
  type DistillFactsArgs,
} from './tools.js';
import type { ChatMessage } from './types.js';

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

  const openRouter = getOpenRouterClient();
  const distillTool = createDistillFactsTool();

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...buildContextMessages(truth),
  ];

  const aiTools = {
    [distillTool.name]: {
      description: distillTool.description,
      parameters: DistillFactsArgsSchema,
      execute: async (args: any) => await distillTool.execute(args),
    },
  };

  console.log('\n[Fact Distiller Agent]');

  const callModel = async (modelToUse: string) => {
    const result = await generateText({
      model: openRouter(modelToUse) as any,
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

    console.warn('No tool call returned; defaulting to empty facts.');
    return { facts: [] };
  };

  try {
    return await callModel(model);
  } catch (primaryError) {
    if (!fallbackModelToUse) {
      console.error(`❌ Primary model (${model}) failed and no fallbackModel was provided`);
      throw primaryError;
    }

    console.warn(`⚠️ Primary model (${model}) failed, trying fallback model (${fallbackModelToUse})...`, primaryError);

    try {
      return await callModel(fallbackModelToUse);
    } catch (fallbackError) {
      console.error('❌ Both primary and fallback models failed');
      console.error('Primary error:', primaryError);
      console.error('Fallback error:', fallbackError);

      const primaryMsg = String(primaryError).slice(0, 50);
      const fallbackMsg = String(fallbackError).slice(0, 50);

      throw new Error(`Failed to distill puzzle facts: Primary(${primaryMsg}), Fallback(${fallbackMsg})`);
    }
  }
}
