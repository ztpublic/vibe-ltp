/**
 * SocketGameStateController
 * Real implementation of GameStateController using Socket.IO
 * Extracted from the original useGameState hook
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type GameState, type GameStateData, type PuzzleContent } from '@vibe-ltp/shared';
import { acquireSocket, releaseSocket, attachSocketLifecycle, isSocketConnected } from '../../../lib/socketManager';
import type { ToastInput } from '../utils/notifications';
import type { GameStateController } from './GameStateController';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

/**
 * Hook that provides a socket-based game state controller for production
 * Manages Socket.IO connection and synchronizes state with server
 */
export function useSocketGameStateController(onNotify?: (toast: ToastInput) => void): GameStateController {
  const [gameState, setGameState] = useState<GameState>('NotStarted');
  const [puzzleContent, setPuzzleContent] = useState<PuzzleContent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Acquire socket from singleton manager
    const socket = acquireSocket(SOCKET_URL);
    socketRef.current = socket;

    // Attach lifecycle handlers
    const detachLifecycle = attachSocketLifecycle(socket, {
      onConnect: () => {
        setIsConnected(true);
        onNotify?.({ type: 'info', message: '已连接游戏服务' });
      },
      onReconnect: () => {
        setIsConnected(true);
        onNotify?.({ type: 'info', message: '已重新连接游戏服务' });
      },
      onConnectError: (err) => {
        setIsConnected(false);
        onNotify?.({ type: 'warning', message: `连接错误：${err.message}` });
      },
      onDisconnect: (reason) => {
        setIsConnected(false);
        onNotify?.({ type: 'warning', message: `连接已断开：${reason}` });
      },
    });

    // Listen for game state updates
    const handleGameStateUpdate = (data: GameStateData) => {
      setGameState(data.state);
      if (data.puzzleContent) {
        setPuzzleContent(data.puzzleContent);
      }
    };

    socket.on(SOCKET_EVENTS.GAME_STATE_UPDATED, handleGameStateUpdate);

    // Set initial connection state
    if (socket.connected) {
      setIsConnected(true);
    }

    // Cleanup on unmount
    return () => {
      socket.off(SOCKET_EVENTS.GAME_STATE_UPDATED, handleGameStateUpdate);
      detachLifecycle();
      releaseSocket(socket);
      socketRef.current = null;
    };
  }, []);

  const startGame = useCallback((content: PuzzleContent) => {
    const socket = socketRef.current;
    if (!socket || !isSocketConnected(socket)) {
      onNotify?.({ type: 'warning', message: '无法开始：未连接服务器' });
      return;
    }
    
    // Optimistically update local state for responsive UI
    setGameState('Started');
    setPuzzleContent(content);
    
    // Emit with acknowledgment callback
    socket.emit(
      SOCKET_EVENTS.GAME_STARTED, 
      { puzzleContent: content },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          onNotify?.({ type: 'error', message: `开始失败：${response.error || '未知错误'}` });
          // Revert optimistic update on failure
          setGameState('NotStarted');
          setPuzzleContent(null);
        }
      }
    );
  }, []);

  const resetGame = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !isSocketConnected(socket)) {
      onNotify?.({ type: 'warning', message: '无法重置：未连接服务器' });
      return;
    }
    
    // Optimistically update local state
    setGameState('NotStarted');
    setPuzzleContent(null);
    
    // Emit with acknowledgment callback
    socket.emit(
      SOCKET_EVENTS.GAME_RESET,
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          onNotify?.({ type: 'error', message: `重置失败：${response.error || '未知错误'}` });
        }
      }
    );
  }, []);

  return {
    gameState,
    puzzleContent,
    isConnected,
    startGame,
    resetGame,
  };
}
