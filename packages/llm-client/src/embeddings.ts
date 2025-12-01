/**
 * Embeddings Utilities
 * Helpers for generating embeddings and computing cosine similarity
 */

import type { Embedding } from 'ai';

const OPENROUTER_EMBEDDINGS_URL =
  (process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '') + '/embeddings';
const EMBEDDING_MODEL_ID = 'qwen/qwen3-embedding-8b';

interface OpenRouterEmbeddingResponse {
  data?: Array<{
    embedding?: Embedding;
    index?: number;
  }>;
}

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }
  return apiKey;
}

function buildHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': process.env.OPENROUTER_REFERRER ?? 'https://vibe-ltp.example.com',
    'X-Title': process.env.OPENROUTER_APP_TITLE ?? 'Vibe Lateral Thinking Puzzles',
  };
}

function parseEmbeddings(
  payload: OpenRouterEmbeddingResponse,
  expectedLength: number
): Embedding[] {
  if (!payload?.data || !Array.isArray(payload.data)) {
    throw new Error('Invalid OpenRouter embeddings response format');
  }

  const embeddings = payload.data.map(item => {
    if (!item?.embedding || !Array.isArray(item.embedding)) {
      throw new Error('Invalid embedding vector returned by OpenRouter');
    }
    return item.embedding;
  });

  if (embeddings.length !== expectedLength) {
    throw new Error('Embedding count mismatch between request and response');
  }

  return embeddings;
}

/**
 * Generate embeddings for a list of text inputs using OpenRouter.
 */
export async function embedTexts(texts: string[]): Promise<Embedding[]> {
  if (texts.length === 0) {
    return [];
  }

  const apiKey = getApiKey();

  const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify({
      model: EMBEDDING_MODEL_ID,
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `OpenRouter embeddings request failed (${response.status}): ${errorText || response.statusText}`
    );
  }

  const payload = (await response.json()) as OpenRouterEmbeddingResponse;
  return parseEmbeddings(payload, texts.length);
}

function cosineSimilarity(a: Embedding, b: Embedding): number {
  if (a.length !== b.length) {
    throw new Error('Embedding dimensions do not match for cosine similarity calculation');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const valueA = a[i];
    const valueB = b[i];

    if (valueA === undefined || valueB === undefined) {
      throw new Error('Embedding vector contained undefined values');
    }

    dotProduct += valueA * valueB;
    normA += valueA * valueA;
    normB += valueB * valueB;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Embed a query text and find the closest match from a precomputed list.
 */
export async function findMostSimilarEmbedding(
  text: string,
  embeddings: Embedding[]
): Promise<{ similarity: number; index: number }> {
  if (embeddings.length === 0) {
    throw new Error('Embeddings array is empty');
  }

  const [queryEmbedding] = await embedTexts([text]);

  if (!queryEmbedding) {
    throw new Error('Failed to generate query embedding');
  }

  let bestIndex = 0;
  let bestSimilarity = -Infinity;

  embeddings.forEach((embedding, index) => {
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestIndex = index;
    }
  });

  return { similarity: bestSimilarity, index: bestIndex };
}

export type { Embedding };
