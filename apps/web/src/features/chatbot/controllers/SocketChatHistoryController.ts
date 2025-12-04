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
import type { ToastInput } from '../utils/notifications';
import type { ChatHistoryController, ChatHistoryMessage } from './ChatHistoryController';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:${process.env.NEXT_PUBLIC_BACKEND_PORT || 4000}`;

/**
 * Hook that provides a socket-based chat history controller for production
 * Handles chat history sync and message persistence via Socket.IO
 */
export function useSocketChatHistoryController(
  sessionId: string,
  onNotify?: (toast: ToastInput) => void,
  initialMessages: ChatHistoryMessage[] = [],
): ChatHistoryController {
  const [messages, setMessages] = useState<ChatHistoryMessage[]>(initialMessages);
  const socketRef = useRef<Socket | null>(null);
  const hasRestoredRef = useRef(false);
  const everConnectedRef = useRef(false);
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
  // Adopt initial messages when provided (e.g., join snapshot) before socket sync arrives
  useEffect(() => {
    if (initialMessages.length > 0 && !hasRestoredRef.current) {
      mergeAndSortMessages(initialMessages);
    }
  }, [initialMessages, mergeAndSortMessages]);

  useEffect(() => {
    const socket = acquireSocket(SOCKET_URL, sessionId);
    socketRef.current = socket;

    const handleConnect = () => {
      hasRestoredRef.current = false;
      everConnectedRef.current = true;
    };

    const handleDisconnect = () => {
      hasRestoredRef.current = false;
      rejectPendingRestores(new Error('Socket disconnected during history sync'));
    };

    // Listen for chat history sync (initial load)
    const handleChatHistorySync = (data: { sessionId?: string; messages: ChatHistoryMessage[] }) => {
      if (data.sessionId && data.sessionId !== sessionId) return;
      onNotify?.({
        type: 'info',
        message: `已同步历史消息 (${data.messages.length} 条)`,
      });
      mergeAndSortMessages(data.messages);
      hasRestoredRef.current = true;
      resolvePendingRestores(data.messages);
    };

    // Listen for new messages broadcast from server
    const handleMessageAdded = (data: { sessionId?: string; message: ChatHistoryMessage }) => {
      if (data.sessionId && data.sessionId !== sessionId) return;
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
  }, [mergeAndSortMessages, onNotify, sessionId]);

  const onMessageAdded = useCallback((message: ChatHistoryMessage) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, {
        sessionId,
        message: {
          ...message,
          timestamp: message.timestamp || new Date().toISOString(),
        },
      });
    } else {
      if (everConnectedRef.current) {
        onNotify?.({
          type: 'warning',
          message: '连接已断开，暂存消息未发送',
        });
      }
    }
  }, [sessionId]);

  const syncHistory = useCallback(async () => {
    if (hasRestoredRef.current) {
      return messages;
    }

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      if (everConnectedRef.current) {
        onNotify?.({
          type: 'warning',
          message: '连接已断开，无法同步聊天记录',
        });
      }
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
      onNotify?.({
        type: 'warning',
        message: `聊天记录同步失败：${error.message}`,
      });
      rejectPendingRestores(error);
      return messages;
    }
  }, [messages, sessionId]);

  return {
    sessionId,
    messages,
    onMessageAdded,
    syncHistory,
  };
}
