/**
 * MockChatHistoryController
 * Test implementation of ChatHistoryController with in-memory storage
 */

'use client';

import { useState, useCallback } from 'react';
import type { ChatHistoryController, ChatHistoryMessage } from './ChatHistoryController';

/**
 * Hook that provides a mock chat history controller for testing
 * Stores messages in local state, no external dependencies
 */
export function useMockChatHistoryController(
  initialMessages: ChatHistoryMessage[] = []
): ChatHistoryController {
  const [messages, setMessages] = useState<ChatHistoryMessage[]>(initialMessages);

  const onMessageAdded = useCallback((message: ChatHistoryMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const syncHistory = useCallback(async () => {
    // For mock, just return current messages
    return messages;
  }, [messages]);

  return {
    messages,
    onMessageAdded,
    syncHistory,
  };
}
