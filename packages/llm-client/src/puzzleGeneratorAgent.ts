/**
 * Puzzle Generator Agent
 * Generates a new lateral thinking puzzle surface + truth.
 */

import { generateText } from 'ai';
import { createLogger } from '@vibe-ltp/shared';
import { callWithFallbackModel } from './fallback.js';
import { openRouterLanguageModel } from './models.js';
import type { ChatMessage } from './types.js';

const logger = createLogger({ module: 'puzzleGenerator' });

export interface PuzzleGeneratorInput {
  /**
   * Optional creative direction / constraints for the generated puzzle.
   * Example: "校园题、不要暴力、结局反转"
   */
  prompt?: string;
}

export interface PuzzleGenerationResult {
  puzzleSurface: string;
  puzzleTruth: string;
}

export interface PuzzleGeneratorOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
}

export function buildPuzzleGeneratorSystemPrompt(): string {
  return `You are a lateral thinking puzzle generator (situation puzzle / 海龟汤).

TASK:
- Generate ONE brand-new puzzle in Chinese.
- Output must include:
  - puzzleSurface (汤面): what players see
  - puzzleTruth (汤底): the full hidden story that explains the surface

QUALITY RULES:
- The truth must fully and uniquely explain the surface (no loose ends).
- The puzzle should be solvable via yes/no questions; avoid relying on obscure trivia.
- Surface should be short, vivid, and intriguing (1-3 sentences).
- Truth should be clear and complete (3-8 sentences).

OUTPUT FORMAT:
Return ONLY a single valid JSON object (no Markdown, no code fences, no extra text) in this exact shape:
{"puzzleSurface":"...","puzzleTruth":"..."}`;
}

function buildContextMessages(input: PuzzleGeneratorInput): ChatMessage[] {
  const prompt = input.prompt?.trim();

  if (!prompt) {
    return [
      {
        role: 'user',
        content: 'Generate a new puzzle.',
      },
    ];
  }

  return [
    {
      role: 'user',
      content: `Generate a new puzzle with the following creative direction / constraints:\n${prompt}`,
    },
  ];
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;

  const lines = trimmed.split('\n');
  if (lines.length < 2) return trimmed;

  const firstLine = lines[0]?.trim() ?? '';
  if (!firstLine.startsWith('```')) return trimmed;

  if ((lines[lines.length - 1]?.trim() ?? '') === '```') {
    lines.pop();
  }

  lines.shift();
  return lines.join('\n').trim();
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (!ch) continue;

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = false;
      }

      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return null;
}

function parsePuzzleJson(text: string): PuzzleGenerationResult | null {
  const normalized = stripCodeFences(text);
  if (!normalized) return null;

  const tryParse = (candidate: string): PuzzleGenerationResult | null => {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (!parsed || typeof parsed !== 'object') return null;

      const puzzleSurface =
        typeof (parsed as any).puzzleSurface === 'string' ? (parsed as any).puzzleSurface.trim() : '';
      const puzzleTruth = typeof (parsed as any).puzzleTruth === 'string' ? (parsed as any).puzzleTruth.trim() : '';
      if (!puzzleSurface || !puzzleTruth) return null;

      return { puzzleSurface, puzzleTruth };
    } catch {
      return null;
    }
  };

  const direct = tryParse(normalized);
  if (direct) return direct;

  const extracted = extractFirstJsonObject(normalized);
  if (!extracted) return null;

  return tryParse(extracted);
}

export async function generatePuzzle(
  input: PuzzleGeneratorInput,
  modelOrOptions: string | PuzzleGeneratorOptions,
  fallbackModel?: string
): Promise<PuzzleGenerationResult> {
  const options: PuzzleGeneratorOptions =
    typeof modelOrOptions === 'string' ? { model: modelOrOptions, fallbackModel } : modelOrOptions;

  if (!options || !options.model) {
    throw new Error('Puzzle generator agent requires a model to be specified.');
  }

  const model = options.model;
  const fallbackModelToUse = options.fallbackModel;
  const systemPrompt = options.systemPrompt ?? buildPuzzleGeneratorSystemPrompt();

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...buildContextMessages(input),
  ];

  logger.info({ hasPrompt: !!input?.prompt }, '[Puzzle Generator Agent]');

  const callModel = async (modelToUse: string) => {
    const result = await generateText({
      model: openRouterLanguageModel(modelToUse),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      maxSteps: 1,
    });

    if (typeof result.text === 'string') {
      const parsed = parsePuzzleJson(result.text);
      if (parsed) return parsed;
    }

    throw new Error('Puzzle generator agent did not return valid JSON.');
  };

  return callWithFallbackModel({
    operation: 'generate puzzle',
    model,
    fallbackModel: fallbackModelToUse,
    call: callModel,
  });
}
