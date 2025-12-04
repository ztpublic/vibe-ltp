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

export type IMessageStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'error'
  | 'custom';

export interface IMessageDecorator {
  id: string;
  label?: string;
  icon?: string;
  /** Border + accent color for decorator */
  color?: string;
  position?: 'footer' | 'side';
  meta?: any;
  /** Optional text shown below the message bubble */
  text?: string;
}

export interface IMessageAction {
  id: string;
  label: string;
  payload?: any;
}

export interface IMessageFeedbackOption {
  id: string;
  label: string;
  type?: 'upvote' | 'downvote' | 'flag' | 'custom';
  payload?: any;
}

export interface IMessageOptions {
  loading?: boolean;
  widget?: string;
  delay?: number;
  payload?: any;
  /** Per-message thumbs visibility + state */
  showThumbsUp?: boolean;
  showThumbsDown?: boolean;
  thumbsUp?: boolean;
  thumbsDown?: boolean;
  /** Disable automatic loading dismissal for this message */
  disableAutoLoadingDismiss?: boolean;
  
  /** User message metadata */
  nickname?: string;
  
  /** Bot message reply metadata */
  replyToId?: string;
  replyToPreview?: string;
  replyToNickname?: string;

  /** Decoration + status metadata */
  decorators?: IMessageDecorator[];
  actions?: IMessageAction[];
  feedbackOptions?: IMessageFeedbackOption[];
  status?: IMessageStatus;
  timestamp?: number | string;
}

export interface IMessage extends IBaseMessage {
  options?: IMessageOptions;
  loading?: boolean;
  disableAutoLoadingDismiss?: boolean;
  widget?: string;
  delay?: number;
  withAvatar?: boolean;
  payload?: any;
  /** Thumb feedback controls + state */
  showThumbsUp?: boolean;
  showThumbsDown?: boolean;
  thumbsUp?: boolean;
  thumbsDown?: boolean;
  
  /** User message: display nickname */
  nickname?: string;
  
  /** Bot message: reply metadata fields */
  replyToId?: string;
  replyToPreview?: string;
  replyToNickname?: string;

  /** Decoration + status metadata */
  decorators?: IMessageDecorator[];
  actions?: IMessageAction[];
  feedbackOptions?: IMessageFeedbackOption[];
  status?: IMessageStatus;
  timestamp?: number | string;
}

export interface IChatState {
  messages: IMessage[];
  // Allow extensibility for user-defined state slices without losing type info for messages
  [key: string]: unknown;
}
