import type { ChatMessage, ChatResponse, UserMessage } from '@vibe-ltp/shared';

export interface ChatService {
  /** Optional session identifier this service is bound to */
  sessionId?: string;
  /**
   * Send a user message and receive bot reply
   * @param userMessage - Complete user message with metadata
   * @param history - Prior conversation messages for context
   * @returns Chat response payload (decorations or reply messages)
   */
  sendMessage(userMessage: UserMessage, history?: ChatMessage[]): Promise<ChatResponse>;

  /**
   * Request a direct answer/solution from the dedicated agent
   * @param userMessage - Complete user message with metadata
   * @param history - Prior conversation messages for context
   * @returns Chat response payload (usually a bot reply)
   */
  requestSolution(userMessage: UserMessage, history?: ChatMessage[]): Promise<ChatResponse>;

  /**
   * Record feedback for a question (e.g., thumbs down)
   */
  setQuestionFeedback?(messageId: string, direction: 'up' | 'down' | null, question?: string): Promise<void>;
}
