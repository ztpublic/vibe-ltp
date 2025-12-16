import { createLogger } from '@vibe-ltp/shared';

const logger = createLogger({ module: 'errorHandler' });

/**
 * Socket Error Handler
 * Standardized error handling for Socket.IO event handlers
 */

interface SocketCallback {
  (response: { success: boolean; error?: string }): void;
}

/**
 * Handle socket errors with consistent logging and callback patterns
 * 
 * @param error - The error that occurred
 * @param context - Context string for logging (e.g., "GAME_STARTED handler")
 * @param callback - Optional callback to send error response
 */
export function handleSocketError(
  error: unknown,
  context: string,
  callback?: SocketCallback
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error({ err: error, context }, '[Socket] Error occurred');
  
  if (callback) {
    callback({ success: false, error: errorMessage });
  }
}

/**
 * Send success callback response
 * 
 * @param callback - Optional callback to send success response
 */
export function sendSocketSuccess(callback?: SocketCallback): void {
  if (callback) {
    callback({ success: true });
  }
}
