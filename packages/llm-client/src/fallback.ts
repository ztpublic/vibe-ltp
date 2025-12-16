/**
 * Primary model call + optional fallback model retry.
 *
 * Many agents share the same flow:
 * - call primary model
 * - if it fails, optionally retry with fallback model
 * - if both fail, throw a compact aggregated error
 */

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
      console.error(`❌ ${operation} primary model (${model}) failed and no fallbackModel was provided`);
      throw primaryError;
    }

    console.warn(
      `⚠️ ${operation} primary model (${model}) failed, trying fallback model (${fallbackModel})...`,
      primaryError
    );

    try {
      return await call(fallbackModel);
    } catch (fallbackError) {
      console.error(`❌ ${operation}: both primary and fallback models failed`);
      console.error('Primary error:', primaryError);
      console.error('Fallback error:', fallbackError);

      throw new Error(
        `Failed to ${operation}: Primary(${shortenError(primaryError)}), Fallback(${shortenError(fallbackError)})`
      );
    }
  }
}

