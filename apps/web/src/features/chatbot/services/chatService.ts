import type { UserMessage, BotMessage } from '@vibe-ltp/shared';

export interface ChatService {
  /**
   * Send a user message and receive bot reply
   * @param userMessage - Complete user message with metadata
   * @returns Bot reply message content
   */
  sendMessage(userMessage: UserMessage): Promise<BotMessage>;
}
