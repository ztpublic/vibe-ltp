/**
 * Chat API types for lateral thinking puzzle interactions
 */

import type { AnswerType, ChatMessage, UserMessage, BotMessage, MessageId } from '../types/messages';

/**
 * Chat Request
 * Sent from client to server when user sends a message
 */
export interface ChatRequest {
  /** The user message being sent */
  message: UserMessage;
  
  /** Conversation history for context */
  history: ChatMessage[];
}

/**
 * Chat Response
 * Sent from server to client with bot reply or user message decoration
 */
export interface ChatResponse {
  /** Bot's reply message with full metadata (fallback/error flows) */
  reply?: BotMessage;

  /** Decoration to attach to the originating user message */
  decoration?: ChatReplyDecoration;
  
  /** Optional game/session state updates */
  newState?: Record<string, unknown>;
}

/**
 * Decoration payload for user message replies
 */
export interface ChatReplyDecoration {
  /** ID of the user message that should be decorated */
  targetMessageId: MessageId;
  /** Canonical answer type */
  answer: AnswerType;
  /** Optional tip to show alongside the decoration */
  tip?: string;
}
