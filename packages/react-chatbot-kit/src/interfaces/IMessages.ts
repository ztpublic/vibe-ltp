/**
 * Extended message interface for react-chatbot-kit
 * Includes metadata fields for user nicknames and bot reply threading
 */

export interface IBaseMessage {
  /** Plain text message content (no encoding) */
  message: string;
  
  /** Message type: 'user' | 'bot' | custom */
  type: string;
  
  /** Numeric ID for react-chatbot-kit internal use */
  id: number;
}

export interface IMessageOptions {
  loading?: boolean;
  widget?: string;
  delay?: number;
  payload?: any;
  
  /** User message metadata */
  nickname?: string;
  
  /** Bot message reply metadata */
  replyToId?: string;
  replyToPreview?: string;
  replyToNickname?: string;
}

export interface IMessage extends IBaseMessage {
  options?: IMessageOptions;
  loading?: boolean;
  widget?: string;
  delay?: number;
  withAvatar?: boolean;
  payload?: any;
  
  /** User message: display nickname */
  nickname?: string;
  
  /** Bot message: reply metadata fields */
  replyToId?: string;
  replyToPreview?: string;
  replyToNickname?: string;
}
