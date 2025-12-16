/**
 * Key Points Matcher Agent
 * Maps a single Q/A turn to which distilled key points are now known
 */

import { generateText } from 'ai';
import { createLogger } from '@vibe-ltp/shared';
import { callWithFallbackModel } from './fallback.js';
import { openRouterLanguageModel } from './models.js';
import {
  createMatchKeyPointsTool,
  type MatchKeyPointsArgs,
} from './tools.js';
import type { ChatMessage } from './types.js';

const logger = createLogger({ module: 'keyPointsMatcher' });

export interface KeyPointsMatchInput {
  question: string;
  answer: string;
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
- A single player question and the host's answer
- Distilled key points of the puzzle truth

TASK:
- Decide which key points are now understood given this Q/A turn.
- Return ONLY the indexes (0-based) of known key points via the tool "match_key_points".

RULES:
- If the answer is "no", first convert the Q/A into an equivalent single statement (e.g., Q: "他是凶手吗？" A: "不是" -> "他不是凶手") and match that statement.
- Include a key point ONLY if the Q/A pair explicitly establishes it or leaves no plausible alternative.
- If the Q/A is vague, partial, or missing a clear link, do NOT mark the point as known.
- Prefer under-inclusion over guessing; avoid speculative leaps or extrapolations beyond this single turn.
- Keep the list minimal and strictly evidence-based.`;
}

function buildContextMessages(input: KeyPointsMatchInput): ChatMessage[] {
  const keyPointsList = input.keyPoints
    .map((kp, idx) => `${idx}. ${kp}`)
    .join('\n');

  return [
    {
      role: 'assistant',
      content: `PLAYER QUESTION:\n${input.question}\n\nHOST ANSWER:\n${input.answer}`,
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

  if (!input.question || input.question.trim().length === 0) {
    throw new Error('Key points matcher requires a non-empty question input.');
  }

  if (!input.answer || input.answer.trim().length === 0) {
    throw new Error('Key points matcher requires a non-empty answer input.');
  }

  // Short-circuit for non-informative answers
  const normalizedAnswer = input.answer.trim().toLowerCase();
  if (normalizedAnswer === 'unknown' || normalizedAnswer === 'irrelevant') {
    return { matchedIndexes: [] };
  }

  const matchTool = createMatchKeyPointsTool();

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...buildContextMessages(input),
  ];

  const aiTools = {
    [matchTool.name]: {
      description: matchTool.description,
      parameters: matchTool.parameters,
    },
  };

  logger.info({ question: input.question, answer: input.answer }, '[Key Points Matcher Agent]');

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
        const args = toolCall.args as MatchKeyPointsArgs;
        return { matchedIndexes: args.matchedIndexes };
      }
    }

    logger.warn('No tool call returned; defaulting to no matches.');
    return { matchedIndexes: [] };
  };

  return callWithFallbackModel({
    operation: 'match key points',
    model,
    fallbackModel: fallbackModelToUse,
    call: callModel,
  });
}
