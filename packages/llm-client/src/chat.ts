/**
 * Simple Chat API
 * Non-agentic LLM responses for basic chat interactions
 */

import { generateText } from 'ai';
import { openRouterLanguageModel } from './models.js';
import type { ChatMessage } from './types.js';

export type ChatModelId = string; // e.g. 'openai/gpt-4o-mini', 'google/gemini-2.0-flash-001'

export interface ChatReplyOptions {
  model: ChatModelId;
  systemPrompt: string;
  messages: ChatMessage[];
}

/**
 * Generate a simple chat reply without tool calling
 * Uses the Vercel AI SDK's generateText function
 */
export async function chatReply(options: ChatReplyOptions): Promise<string> {
  const { model, systemPrompt, messages } = options;

  try {
    const result = await generateText({
      model: openRouterLanguageModel(model),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });

    return result.text;
  } catch (error) {
    console.error('Error in chatReply:', error);
    throw new Error('Failed to generate chat response');
  }
}
