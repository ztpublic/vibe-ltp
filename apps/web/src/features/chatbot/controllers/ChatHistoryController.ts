/**
 * ChatHistoryController Interface
 * Abstract interface for chat history management
 */

export interface ChatHistoryMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  nickname?: string;
  replyToId?: string;
  replyToPreview?: string;
  replyToNickname?: string;
  timestamp: string;
}

export interface ChatHistoryController {
  /** Initial chat history messages */
  messages: ChatHistoryMessage[];
  
  /** Callback when new message is added */
  onMessageAdded: (message: ChatHistoryMessage) => void;
  
  /** Retrieve chat history (async for socket-based implementations) */
  syncHistory: () => Promise<ChatHistoryMessage[]>;
}
