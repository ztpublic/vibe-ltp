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
  const pendingRestoreResolvers = useRef<((msgs: ChatHistoryMessage[]) => void)[]>([]);
  const pendingRestoreRejectors = useRef<((err: Error) => void)[]>([]);

  const resolvePendingRestores = (msgs: ChatHistoryMessage[]) => {
    pendingRestoreResolvers.current.forEach((resolve) => resolve(msgs));
    pendingRestoreResolvers.current = [];
    pendingRestoreRejectors.current = [];
  };

  const rejectPendingRestores = (err: Error) => {
    pendingRestoreRejectors.current.forEach((reject) => reject(err));
    pendingRestoreResolvers.current = [];
    pendingRestoreRejectors.current = [];
  };

  const mergeAndSortMessages = useCallback((incoming: ChatHistoryMessage[]) => {
    setMessages((prev) => {
      const map = new Map<string, ChatHistoryMessage>();
      for (const msg of prev) {
        if (msg.id) map.set(msg.id, msg);
      }
      for (const msg of incoming) {
        if (msg.id) map.set(msg.id, msg);
      }

      const combined = Array.from(map.values());
      combined.sort((a, b) => {
        const aTime = Date.parse(a.timestamp);
        const bTime = Date.parse(b.timestamp);
        if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
          return aTime - bTime;
        }
        return String(a.id).localeCompare(String(b.id));
      });

      return combined;
    });
  }, []);

  useEffect(() => {
    const socket = acquireSocket(SOCKET_URL);
    socketRef.current = socket;

    const handleConnect = () => {
      hasRestoredRef.current = false;
    };

    const handleDisconnect = () => {
      hasRestoredRef.current = false;
      rejectPendingRestores(new Error('Socket disconnected during history sync'));
    };

    // Listen for chat history sync (initial load)
    const handleChatHistorySync = (data: { messages: ChatHistoryMessage[] }) => {
      console.log('[SocketChatHistoryController] Received history:', data.messages.length, 'messages');
      mergeAndSortMessages(data.messages);
      hasRestoredRef.current = true;
      resolvePendingRestores(data.messages);
    };

    // Listen for new messages broadcast from server
    const handleMessageAdded = (data: { message: ChatHistoryMessage }) => {
      console.log('[SocketChatHistoryController] Received new message:', data.message.type, data.message.id);
      mergeAndSortMessages([data.message]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.CHAT_HISTORY_SYNC, handleChatHistorySync);
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, handleMessageAdded);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_EVENTS.CHAT_HISTORY_SYNC, handleChatHistorySync);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, handleMessageAdded);
      releaseSocket(socket);
      socketRef.current = null;
    };
  }, [mergeAndSortMessages]);

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
    if (hasRestoredRef.current) {
      return messages;
    }

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      console.warn('[SocketChatHistoryController] Cannot sync history: socket disconnected');
      return messages;
    }

    // Wait for next CHAT_HISTORY_SYNC event or timeout
    const waitForHistory = new Promise<ChatHistoryMessage[]>((resolve, reject) => {
      pendingRestoreResolvers.current.push(resolve);
      pendingRestoreRejectors.current.push(reject);
    });

    const timeout = new Promise<ChatHistoryMessage[]>((_, reject) => {
      setTimeout(() => reject(new Error('History sync timeout')), 10_000);
    });

    try {
      const restored = await Promise.race([waitForHistory, timeout]);
      return restored;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn('[SocketChatHistoryController] History sync failed:', error.message);
      rejectPendingRestores(error);
      return messages;
    }
  }, [messages]);

  return {
    messages,
    onMessageAdded,
    syncHistory,
  };
}
