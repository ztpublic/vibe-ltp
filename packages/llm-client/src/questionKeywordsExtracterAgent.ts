/**
 * Question Keywords Extracter Agent
 * Extracts 1-3 pivotal keywords directly from a player question
 */

import { generateText } from 'ai';
import { createLogger } from '@vibe-ltp/shared';
import { callWithFallbackModel } from './fallback.js';
import { openRouterLanguageModel } from './models.js';
import {
  createExtractQuestionKeywordsTool,
  type ExtractQuestionKeywordsArgs,
} from './tools.js';

const logger = createLogger({ module: 'questionKeywordsExtracter' });

export interface QuestionKeywordsExtracterOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
}

export interface QuestionKeywordsExtractionResult {
  keywords: string[];
}

export function buildQuestionKeywordsExtracterSystemPrompt(): string {
  return `You are a "question keyword extractor" for a lateral thinking puzzle host.

ROLE:
- Receive a single player question.
- Return 1-3 concise keywords copied verbatim from the question text.

KEYWORD RULES:
- Copy exact wording; do not paraphrase, translate, or invent.
- Focus on nouns or short noun phrases that capture the question's core.
- Avoid filler, stopwords, or generic terms.
- Always return 1-3 items.

OUTPUT FORMAT:
- Call the tool "extract_question_keywords" with the keyword array.`;
}

/**
 * Extract keywords from a player question via OpenRouter tool call
 */
export async function extractQuestionKeywords(
  question: string,
  modelOrOptions: string | QuestionKeywordsExtracterOptions,
  fallbackModel?: string
): Promise<QuestionKeywordsExtractionResult> {
  const options: QuestionKeywordsExtracterOptions =
    typeof modelOrOptions === 'string' ? { model: modelOrOptions, fallbackModel } : modelOrOptions;

  if (!options || !options.model) {
    throw new Error('Question keywords extracter agent requires a model to be specified.');
  }

  const model = options.model;
  const fallbackModelToUse = options.fallbackModel;
  const systemPrompt = options.systemPrompt ?? buildQuestionKeywordsExtracterSystemPrompt();

  const extractTool = createExtractQuestionKeywordsTool();

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    {
      role: 'assistant' as const,
      content: `PLAYER QUESTION:\n${question}`,
    },
  ];

  const aiTools = {
    [extractTool.name]: {
      description: extractTool.description,
      parameters: extractTool.parameters,
    },
  };

  logger.info('[Question Keywords Extracter Agent]');

  const callModel = async (modelToUse: string) => {
    const result = await generateText({
      model: openRouterLanguageModel(modelToUse),
      messages,
      tools: aiTools,
      maxSteps: 1,
    });

    if (result.toolCalls && result.toolCalls.length > 0) {
      const toolCall = result.toolCalls[0];
      if (toolCall) {
        const args = toolCall.args as ExtractQuestionKeywordsArgs;
        return { keywords: args.keywords };
      }
    }

    logger.warn('No tool call returned; defaulting to empty keyword list.');
    return { keywords: [] };
  };

  return callWithFallbackModel({
    operation: 'extract question keywords',
    model,
    fallbackModel: fallbackModelToUse,
    call: callModel,
  });
}
