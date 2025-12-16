/**
 * Model selection + typed OpenRouter model wrapper.
 *
 * Centralizes:
 * - default model IDs
 * - env-based overrides
 * - the single `as LanguageModel` cast for OpenRouter's provider typing
 */

import type { LanguageModel } from 'ai';
import { getOpenRouterClient } from './client.js';

export interface ModelSelection {
  model: string;
  fallbackModel?: string;
}

export const DEFAULT_OPENROUTER_MODEL = 'x-ai/grok-4-fast';

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getModelSelection(overrides?: Partial<ModelSelection>): ModelSelection {
  const model =
    (typeof overrides?.model === 'string' && overrides.model.trim().length > 0 ? overrides.model.trim() : undefined) ??
    readOptionalEnv('OPENROUTER_MODEL') ??
    DEFAULT_OPENROUTER_MODEL;

  const fallbackModel =
    (typeof overrides?.fallbackModel === 'string' && overrides.fallbackModel.trim().length > 0
      ? overrides.fallbackModel.trim()
      : undefined) ??
    readOptionalEnv('OPENROUTER_FALLBACK_MODEL');

  return { model, fallbackModel };
}

export function openRouterLanguageModel(modelId: string): LanguageModel {
  const openRouter = getOpenRouterClient();
  return openRouter(modelId) as unknown as LanguageModel;
}

