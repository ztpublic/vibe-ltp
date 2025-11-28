/**
 * OpenRouter Client Initialization
 * Manages the singleton OpenRouter client instance
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

let client: ReturnType<typeof createOpenRouter> | null = null;

export function getOpenRouterClient() {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    client = createOpenRouter({
      apiKey,
      headers: {
        'HTTP-Referer': process.env.OPENROUTER_REFERRER ?? 'https://vibe-ltp.example.com',
        'X-Title': process.env.OPENROUTER_APP_TITLE ?? 'Vibe Lateral Thinking Puzzles',
      },
    });
  }
  return client;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetClient() {
  client = null;
}
