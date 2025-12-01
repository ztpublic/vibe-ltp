/**
 * Question Keywords Extracter Agent
 * Extracts 1-3 pivotal keywords directly from a player question
 */

import { generateText } from 'ai';
import { getOpenRouterClient } from './client.js';
import {
  createExtractQuestionKeywordsTool,
  ExtractQuestionKeywordsArgsSchema,
  type ExtractQuestionKeywordsArgs,
} from './tools.js';

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

  const openRouter = getOpenRouterClient();
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
      parameters: ExtractQuestionKeywordsArgsSchema,
      execute: async (args: any) => await extractTool.execute(args),
    },
  };

  console.log('\n[Question Keywords Extracter Agent]');

  const callModel = async (modelToUse: string) => {
    const result = await generateText({
      model: openRouter(modelToUse) as any,
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

    console.warn('No tool call returned; defaulting to empty keyword list.');
    return { keywords: [] };
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

      throw new Error(`Failed to extract question keywords: Primary(${primaryMsg}), Fallback(${fallbackMsg})`);
    }
  }
}
