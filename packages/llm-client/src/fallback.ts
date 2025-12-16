/**
 * Primary model call + optional fallback model retry.
 *
 * Many agents share the same flow:
 * - call primary model
 * - if it fails, optionally retry with fallback model
 * - if both fail, throw a compact aggregated error
 */

import { createLogger } from '@vibe-ltp/shared';

const logger = createLogger({ module: 'llm-fallback' });

export interface ModelFallbackOptions {
  model: string;
  fallbackModel?: string;
}

export interface CallWithFallbackParams<T> extends ModelFallbackOptions {
  operation: string;
  call: (modelId: string) => Promise<T>;
}

function shortenError(error: unknown): string {
  return String(error).slice(0, 50);
}

export async function callWithFallbackModel<T>({
  operation,
  model,
  fallbackModel,
  call,
}: CallWithFallbackParams<T>): Promise<T> {
  try {
    return await call(model);
  } catch (primaryError) {
    if (!fallbackModel) {
      logger.error({ err: primaryError, model }, `❌ ${operation} primary model failed`);
      throw primaryError;
    }

    logger.warn(
      { err: primaryError, model, fallbackModel },
      `⚠️ ${operation} primary model failed, trying fallback`
    );

    try {
      return await call(fallbackModel);
    } catch (fallbackError) {
      logger.error(
        { primaryError, fallbackError },
        `❌ ${operation}: both primary and fallback models failed`
      );

      throw new Error(
        `Failed to ${operation}: Primary(${shortenError(primaryError)}), Fallback(${shortenError(fallbackError)})`
      );
    }
  }
}

