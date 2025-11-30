import type { UserMessage, BotMessage, ChatMessage } from '@vibe-ltp/shared';

export interface ChatService {
  /**
   * Send a user message and receive bot reply
   * @param userMessage - Complete user message with metadata
   * @param history - Prior conversation messages for context
   * @returns Bot reply message content
   */
  sendMessage(userMessage: UserMessage, history?: ChatMessage[]): Promise<BotMessage>;
}
