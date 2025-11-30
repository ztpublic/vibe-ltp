/**
 * ChatHistoryController Interface
 * Abstract interface for chat history management
 * Now aligned with unified message types from @vibe-ltp/shared
 */

import type { ChatMessage } from '@vibe-ltp/shared';

export type { ChatMessage as ChatHistoryMessage };

export interface ChatHistoryController {
  /** Initial chat history messages */
  messages: ChatMessage[];
  
  /** Callback when new message is added */
  onMessageAdded: (message: ChatMessage) => void;
  
  /** Retrieve chat history (async for socket-based implementations) */
  syncHistory: () => Promise<ChatMessage[]>;
}
