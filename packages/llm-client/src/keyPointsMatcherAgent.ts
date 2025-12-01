/**
 * Key Points Matcher Agent
 * Maps a knowledge summary to which distilled key points are now known
 */

import { generateText } from 'ai';
import { getOpenRouterClient } from './client.js';
import {
  createMatchKeyPointsTool,
  MatchKeyPointsArgsSchema,
  type MatchKeyPointsArgs,
} from './tools.js';
import type { ChatMessage } from './types.js';

export interface KeyPointsMatchInput {
  summary: string;
  keyPoints: string[];
}

export interface KeyPointsMatchResult {
  matchedIndexes: number[];
}

export interface KeyPointsMatcherOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
}

export function buildKeyPointsMatcherSystemPrompt(): string {
  return `You are a "key points matcher" for a lateral thinking puzzle.

INPUTS:
- Summary of what players know so far (from surface + Q/A history)
- Distilled key points of the puzzle truth

TASK:
- Decide which key points are now understood given the provided summary.
- Return ONLY the indexes (0-based) of known key points via the tool "match_key_points".

RULES:
- Prefer precision over guessing; include only key points clearly implied by the summary.
- Avoid speculative leaps. Keep the list minimal.`;
}

function buildContextMessages(input: KeyPointsMatchInput): ChatMessage[] {
  const keyPointsList = input.keyPoints
    .map((kp, idx) => `${idx}. ${kp}`)
    .join('\n');

  return [
    {
      role: 'assistant',
      content: `SUMMARY OF KNOWN INFO:\n${input.summary}`,
    },
    {
      role: 'assistant',
      content: `KEY POINTS (0-based):\n${keyPointsList}`,
    },
  ];
}

export async function matchKeyPoints(
  input: KeyPointsMatchInput,
  modelOrOptions: string | KeyPointsMatcherOptions,
  fallbackModel?: string
): Promise<KeyPointsMatchResult> {
  const options: KeyPointsMatcherOptions =
    typeof modelOrOptions === 'string' ? { model: modelOrOptions, fallbackModel } : modelOrOptions;

  if (!options || !options.model) {
    throw new Error('Key points matcher agent requires a model to be specified.');
  }

  const model = options.model;
  const fallbackModelToUse = options.fallbackModel;
  const systemPrompt = options.systemPrompt ?? buildKeyPointsMatcherSystemPrompt();

  if (!input.summary || input.summary.trim().length === 0) {
    throw new Error('Key points matcher requires a non-empty summary input.');
  }

  const openRouter = getOpenRouterClient();
  const matchTool = createMatchKeyPointsTool();

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...buildContextMessages(input),
  ];

  const aiTools = {
    [matchTool.name]: {
      description: matchTool.description,
      parameters: MatchKeyPointsArgsSchema,
      execute: async (args: any) => await matchTool.execute(args),
    },
  };

  console.log('\n[Key Points Matcher Agent]');
  console.log('Summary:', input.summary);

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
        const args = toolCall.args as MatchKeyPointsArgs;
        return { matchedIndexes: args.matchedIndexes };
      }
    }

    console.warn('No tool call returned; defaulting to no matches.');
    return { matchedIndexes: [] };
  };

  try {
    return await callModel(model);
  } catch (primaryError) {
    if (!fallbackModelToUse) {
      console.error(`❌ Key points matcher primary model (${model}) failed and no fallbackModel was provided`);
      throw primaryError;
    }

    console.warn(`⚠️ Key points matcher primary model (${model}) failed, trying fallback model (${fallbackModelToUse})...`, primaryError);

    try {
      return await callModel(fallbackModelToUse);
    } catch (fallbackError) {
      console.error('❌ Key points matcher: both primary and fallback models failed');
      console.error('Primary error:', primaryError);
      console.error('Fallback error:', fallbackError);

      const primaryMsg = String(primaryError).slice(0, 50);
      const fallbackMsg = String(fallbackError).slice(0, 50);

      throw new Error(`Failed to match key points: Primary(${primaryMsg}), Fallback(${fallbackMsg})`);
    }
  }
}
