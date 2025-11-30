/**
 * Chat API types for lateral thinking puzzle interactions
 */

import type { ChatMessage, UserMessage, BotMessage } from '../types/messages';

/**
 * Chat Request
 * Sent from client to server when user sends a message
 */
export interface ChatRequest {
  /** Optional puzzle identifier (if targeting specific puzzle) */
  puzzleId?: string;
  
  /** The user message being sent */
  message: UserMessage;
  
  /** Conversation history for context */
  history: ChatMessage[];
}

/**
 * Chat Response
 * Sent from server to client with bot reply
 */
export interface ChatResponse {
  /** Bot's reply message with full metadata */
  reply: BotMessage;
  
  /** Optional game/session state updates */
  newState?: Record<string, unknown>;
}
