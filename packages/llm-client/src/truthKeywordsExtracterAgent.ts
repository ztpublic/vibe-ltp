/**
 * Truth Keywords Extracter Agent
 * Extracts 2-5 important keywords from the puzzle truth that are absent from the surface
 */

import { generateText } from 'ai';
import { createLogger } from '@vibe-ltp/shared';
import { callWithFallbackModel } from './fallback.js';
import { openRouterLanguageModel } from './models.js';
import {
  createExtractTruthKeywordsTool,
  type ExtractTruthKeywordsArgs,
} from './tools.js';
import type { ChatMessage } from './types.js';

const logger = createLogger({ module: 'truthKeywordsExtracter' });

export interface TruthKeywordsContext {
  /** The puzzle surface (汤面) shown to players */
  surface: string;
  /** The puzzle truth (汤底) known to the host */
  truth: string;
}

export interface TruthKeywordsExtractionResult {
  keywords: string[];
}

export interface TruthKeywordsExtracterOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
}

/**
 * Build the system prompt for the truth keywords extracter agent
 */
export function buildTruthKeywordsExtracterSystemPrompt(): string {
  return `You are a lateral thinking puzzle "truth keyword extractor".

ROLE:
- You receive the puzzle surface (what players see) and the full hidden truth.
- Your task is to surface 2-5 pivotal keywords from the truth that will guide players without revealing everything.

KEYWORD RULES:
- Each keyword MUST appear verbatim in the truth. Keep original casing/wording; do NOT translate, paraphrase, or invent.
- Exclude any word/phrase that appears in the surface (case-insensitive).
- Focus on critical people, objects, events, or details essential to the true story; avoid generic stopwords or filler.
- Prefer single words; short multi-word phrases are allowed only if inseparable.
- No duplicates. Always return 2-5 keywords.

OUTPUT FORMAT:
You MUST respond ONLY by calling the tool "extract_truth_keywords" with the keyword array.`;
}

function buildContextMessages(context: TruthKeywordsContext): ChatMessage[] {
  return [
    {
      role: 'assistant',
      content: `PUZZLE SURFACE (汤面):\n${context.surface}`,
    },
    {
      role: 'assistant',
      content: `PUZZLE TRUTH (汤底):\n${context.truth}`,
    },
    {
      role: 'assistant',
      content: 'REMINDER: Choose keywords that appear in the TRUTH but NOT in the SURFACE.',
    },
  ];
}

/**
 * Extract truth keywords by calling OpenRouter with the keyword extraction tool
 */
export async function extractTruthKeywords(
  context: TruthKeywordsContext,
  modelOrOptions: string | TruthKeywordsExtracterOptions,
  fallbackModel?: string
): Promise<TruthKeywordsExtractionResult> {
  const options: TruthKeywordsExtracterOptions =
    typeof modelOrOptions === 'string' ? { model: modelOrOptions, fallbackModel } : modelOrOptions;

  if (!options || !options.model) {
    throw new Error('Truth keywords extracter agent requires a model to be specified.');
  }

  const model = options.model;
  const fallbackModelToUse = options.fallbackModel;
  const systemPrompt = options.systemPrompt ?? buildTruthKeywordsExtracterSystemPrompt();

  const extractTool = createExtractTruthKeywordsTool();

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...buildContextMessages(context),
  ];

  const aiTools = {
    [extractTool.name]: {
      description: extractTool.description,
      parameters: extractTool.parameters,
    },
  };

  logger.info('[Truth Keywords Extracter Agent]');

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
        const args = toolCall.args as ExtractTruthKeywordsArgs;
        return { keywords: args.keywords };
      }
    }

    logger.warn('No tool call returned; defaulting to empty keyword list.');
    return { keywords: [] };
  };

  return callWithFallbackModel({
    operation: 'extract truth keywords',
    model,
    fallbackModel: fallbackModelToUse,
    call: callModel,
  });
}
