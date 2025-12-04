import { IMessage } from '../interfaces/IMessages';

export type ThumbDirection = 'up' | 'down' | null;

interface IFeedbackEntry {
  direction: ThumbDirection;
  message?: IMessage;
}

const feedbackRegistry = new Map<number, IFeedbackEntry>();

/** Store or update thumb feedback for a message */
export function updateMessageFeedback(
  message: IMessage,
  direction: ThumbDirection
) {
  if (typeof message?.id !== 'number') return;
  feedbackRegistry.set(message.id, {
    direction,
    message: {
      ...message,
      thumbsUp: direction === 'up',
      thumbsDown: direction === 'down',
    },
  });
}

/** Remove a specific message feedback entry */
export function removeMessageFeedback(messageId: number) {
  feedbackRegistry.delete(messageId);
}

/** Clear all feedback state (e.g., when unmounting) */
export function clearFeedbackRegistry() {
  feedbackRegistry.clear();
}

/** Snapshot of all thumbs selections for telemetry/logging */
export function getFeedbackSnapshot() {
  return Array.from(feedbackRegistry.entries()).map(([messageId, entry]) => ({
    messageId,
    direction: entry.direction,
    message: entry.message,
  }));
}
