/**
 * Unified Message Types
 * Core message structure shared across all layers (API, library, application)
 */

/**
 * Message ID: Unique identifier for each message
 * Format: UUID v4 string
 */
export type MessageId = string;

/**
 * Message Type: Distinguishes between different message sources
 */
export type MessageType = 'user' | 'bot' | 'system';

/**
 * Base Message Interface
 * Common fields for all message types
 */
export interface BaseMessage {
  /** Unique message identifier */
  id: MessageId;
  
  /** Message type */
  type: MessageType;
  
  /** Plain text content */
  content: string;
  
  /** ISO timestamp */
  timestamp: string;
}

/**
 * User Message
 * Messages sent by users
 */
export interface UserMessage extends BaseMessage {
  type: 'user';
  
  /** User's display nickname */
  nickname: string;
}

/**
 * Bot Message Reply Metadata
 * Information about which user message the bot is replying to
 */
export interface BotReplyMetadata {
  /** ID of the user message being replied to */
  replyToId: MessageId;
  
  /** Preview text of the replied message (truncated) */
  replyToPreview: string;
  
  /** Nickname of the user who sent the replied message */
  replyToNickname: string;
}

/**
 * Bot Message
 * Messages sent by the bot/assistant
 */
export interface BotMessage extends BaseMessage {
  type: 'bot';
  
  /** Optional reply metadata linking to user question */
  replyMetadata?: BotReplyMetadata;
}

/**
 * System Message
 * System notifications or announcements
 */
export interface SystemMessage extends BaseMessage {
  type: 'system';
}

/**
 * Chat Message Union Type
 * All possible message types
 */
export type ChatMessage = UserMessage | BotMessage | SystemMessage;

/**
 * Type guard: Check if message is a user message
 */
export function isUserMessage(msg: ChatMessage): msg is UserMessage {
  return msg.type === 'user';
}

/**
 * Type guard: Check if message is a bot message
 */
export function isBotMessage(msg: ChatMessage): msg is BotMessage {
  return msg.type === 'bot';
}

/**
 * Type guard: Check if message is a system message
 */
export function isSystemMessage(msg: ChatMessage): msg is SystemMessage {
  return msg.type === 'system';
}
