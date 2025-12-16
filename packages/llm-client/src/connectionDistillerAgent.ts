/**
 * Connection Distiller Agent
 * Produces concise bridging statements between puzzle surface and truth
 */

import { generateText } from 'ai';
import { callWithFallbackModel } from './fallback.js';
import { openRouterLanguageModel } from './models.js';
import {
  createDistillConnectionsTool,
  type DistillConnectionsArgs,
} from './tools.js';
import type { PuzzleContext } from './questionValidatorAgent.js';
import type { ChatMessage } from './types.js';

export interface ConnectionDistillationResult {
  connections: string[];
}

export interface ConnectionDistillerOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
}

/**
 * Build the system prompt for the connection distiller agent
 */
export function buildConnectionDistillerSystemPrompt(): string {
  return `You are a lateral thinking puzzle "connection distiller".

ROLE:
- Players only see the puzzle surface. You also know the hidden truth.
- Your job is to propose concise bridging statements ("connections") that make it easier for players to infer the truth without directly revealing it.

CONNECTION RULES:
- Each connection is a single clear statement in Chinese (no numbering).
- Not a copy of the surface or truth; instead, a missing link that can be reasoned to from the surface and truth combined.
- Ordered from closest to the surface toward closest to the truth.
- 1-3 connections depending on puzzle complexity (at least 1, never more than 3).
- Avoid spoilers of the full truth; no character names or explicit endings.
- Prefer facts that players could plausibly confirm through questioning.

OUTPUT FORMAT:
You MUST respond ONLY by calling the tool "distill_connections" with the array of connection strings.`;
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
 * Distill bridging connections for a puzzle context
 */
export async function distillPuzzleConnections(
  context: PuzzleContext,
  modelOrOptions: string | ConnectionDistillerOptions,
  fallbackModel?: string
): Promise<ConnectionDistillationResult> {
  const options: ConnectionDistillerOptions =
    typeof modelOrOptions === 'string' ? { model: modelOrOptions, fallbackModel } : modelOrOptions;

  if (!options || !options.model) {
    throw new Error('Connection distiller agent requires a model to be specified.');
  }

  const model = options.model;
  const fallbackModelToUse = options.fallbackModel;
  const systemPrompt = options.systemPrompt ?? buildConnectionDistillerSystemPrompt();

  const distillTool = createDistillConnectionsTool();

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...buildContextMessages(context),
  ];

  const aiTools = {
    [distillTool.name]: {
      description: distillTool.description,
      parameters: distillTool.parameters,
    },
  };

  console.log('\n[Connection Distiller Agent]');

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
        const args = toolCall.args as DistillConnectionsArgs;
        return { connections: args.connections };
      }
    }

    console.warn('No tool call returned; defaulting to empty connections.');
    return { connections: [] };
  };

  return callWithFallbackModel({
    operation: 'distill puzzle connections',
    model,
    fallbackModel: fallbackModelToUse,
    call: callModel,
  });
}
