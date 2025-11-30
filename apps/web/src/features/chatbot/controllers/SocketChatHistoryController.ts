/**
 * SocketChatHistoryController
 * Real implementation of ChatHistoryController using Socket.IO
 * Extracted from SoupBotChat component
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@vibe-ltp/shared';
import { acquireSocket, releaseSocket } from '../../../lib/socketManager';
import type { ChatHistoryController, ChatHistoryMessage } from './ChatHistoryController';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:${process.env.NEXT_PUBLIC_BACKEND_PORT || 4000}`;

/**
 * Hook that provides a socket-based chat history controller for production
 * Handles chat history sync and message persistence via Socket.IO
 */
export function useSocketChatHistoryController(): ChatHistoryController {
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    const socket = acquireSocket(SOCKET_URL);
    socketRef.current = socket;

    // Listen for chat history sync
    const handleChatHistorySync = (data: { messages: ChatHistoryMessage[] }) => {
      console.log('[SocketChatHistoryController] Received history:', data.messages.length, 'messages');
      
      if (hasRestoredRef.current) {
        console.log('[SocketChatHistoryController] Already restored, skipping');
        return;
      }
      
      if (data.messages.length === 0) {
        console.log('[SocketChatHistoryController] No messages to restore');
        hasRestoredRef.current = true;
        return;
      }
      
      setMessages(data.messages);
      hasRestoredRef.current = true;
    };

    socket.on(SOCKET_EVENTS.CHAT_HISTORY_SYNC, handleChatHistorySync);

    return () => {
      socket.off(SOCKET_EVENTS.CHAT_HISTORY_SYNC, handleChatHistorySync);
      releaseSocket(socket);
      socketRef.current = null;
    };
  }, []);

  const onMessageAdded = useCallback((message: ChatHistoryMessage) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      console.log('[SocketChatHistoryController] Emitting message to server:', message.type, message.id);
      socket.emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, {
        message: {
          ...message,
          timestamp: message.timestamp || new Date().toISOString(),
        },
      });
    } else {
      console.warn('[SocketChatHistoryController] Socket not connected, cannot emit message');
    }
  }, []);

  const syncHistory = useCallback(async () => {
    // For socket-based implementation, messages are synced via events
    // Return current messages
    return messages;
  }, [messages]);

  return {
    messages,
    onMessageAdded,
    syncHistory,
  };
}
