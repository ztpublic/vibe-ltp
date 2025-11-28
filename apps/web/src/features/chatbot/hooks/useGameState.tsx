'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type GameState, type GameStateData, type PuzzleContent } from '@vibe-ltp/shared';
import { acquireSocket, releaseSocket, attachSocketLifecycle, isSocketConnected } from '../../../lib/socketManager';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export function useGameState() {
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
      onConnect: () => setIsConnected(true),
      onReconnect: () => setIsConnected(true),
      onConnectError: () => setIsConnected(false),
      onDisconnect: () => setIsConnected(false),
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
      console.warn('[useGameState] Cannot start game: socket not connected');
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
          console.error('[useGameState] Failed to start game:', response.error);
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
      console.warn('[useGameState] Cannot reset game: socket not connected');
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
          console.error('[useGameState] Failed to reset game:', response.error);
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
