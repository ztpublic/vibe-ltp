/**
 * History Message Summarizer Agent
 * Produces a concise recap of confirmed knowledge from the surface and Q/A history.
 */

import { generateText } from 'ai';
import { callWithFallbackModel } from './fallback.js';
import { openRouterLanguageModel } from './models.js';
import type { ChatMessage } from './types.js';
import type { QuestionAnswerPair } from './questionValidatorAgent.js';

export interface HistorySummaryContext {
  surface: string;
  conversationHistory: QuestionAnswerPair[];
}

export interface HistorySummaryResult {
  summary: string;
}

export interface HistorySummaryOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
}

/**
 * Build the system prompt for the history summarizer agent
 */
export function buildHistorySummarizerSystemPrompt(): string {
  return `You are a "history message summarizer" for a lateral thinking puzzle.

INPUTS YOU SEE:
- The puzzle surface players received.
- All Q/A turns so far.

TASK:
- Summarize only what is *known* from the surface + Q/A history.
- Exclude any details that are merely restating the surface text.
- Avoid speculation; include only items supported by answers or tight logical deduction from them.
- If little is known, state that briefly instead of inventing facts.

OUTPUT FORMAT:
Respond in Chinese with 2-4 sentences or bullet-style lines. No preambles, apologies, or tool calls.`;
}

function buildContextMessages(context: HistorySummaryContext): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      role: 'assistant',
      content: `PUZZLE SURFACE (汤面):\n${context.surface}`,
    },
  ];

  if (context.conversationHistory.length > 0) {
    const historyText = context.conversationHistory
      .map((item, idx) => `${idx + 1}. Q: ${item.question}\n   A: ${item.answer}`)
      .join('\n\n');

    messages.push({
      role: 'assistant',
      content: `FULL Q/A HISTORY (chronological):\n${historyText}`,
    });
  }

  return messages;
}

/**
 * Summarize what players know so far based on the surface and Q/A history.
 */
export async function summarizePuzzleHistory(
  context: HistorySummaryContext,
  modelOrOptions: string | HistorySummaryOptions,
  fallbackModel?: string
): Promise<HistorySummaryResult> {
  const options: HistorySummaryOptions =
    typeof modelOrOptions === 'string' ? { model: modelOrOptions, fallbackModel } : modelOrOptions;

  if (!options || !options.model) {
    throw new Error('History summarizer agent requires a model to be specified.');
  }

  if (!context.conversationHistory || context.conversationHistory.length === 0) {
    throw new Error('History summarizer agent requires at least one Q/A pair in conversation history.');
  }

  const model = options.model;
  const fallbackModelToUse = options.fallbackModel;
  const systemPrompt = options.systemPrompt ?? buildHistorySummarizerSystemPrompt();

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...buildContextMessages(context),
  ];

  console.log('\n[History Message Summarizer Agent]');

  const callModel = async (modelToUse: string) => {
    const result = await generateText({
      model: openRouterLanguageModel(modelToUse),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      maxSteps: 1,
    });

    if (result.text) {
      return { summary: result.text.trim() };
    }

    console.warn('No text returned; defaulting to empty summary.');
    return { summary: '' };
  };

  return callWithFallbackModel({
    operation: 'summarize puzzle history',
    model,
    fallbackModel: fallbackModelToUse,
    call: callModel,
  });
}
