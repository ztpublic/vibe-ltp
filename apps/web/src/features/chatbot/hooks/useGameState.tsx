'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type GameState, type GameStateData, type PuzzleContent } from '@vibe-ltp/shared';
import { acquireSocket, releaseSocket, attachSocketLifecycle, isSocketConnected } from '../../../lib/socketManager';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export function useGameState(roomId: string = 'default') {
  const [gameState, setGameState] = useState<GameState>('NotStarted');
  const [puzzleContent, setPuzzleContent] = useState<PuzzleContent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const hasJoinedRoom = useRef(false);

  useEffect(() => {
    // Acquire socket from singleton manager
    const socket = acquireSocket(SOCKET_URL, roomId);
    socketRef.current = socket;

    // Attach lifecycle handlers
    const detachLifecycle = attachSocketLifecycle(socket, roomId, {
      onConnect: () => {
        setIsConnected(true);
        // Join room on connect
        if (socket.connected && !hasJoinedRoom.current) {
          console.log('[useGameState] joining room', { roomId, socketId: socket.id });
          socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId });
          hasJoinedRoom.current = true;
        }
      },
      onReconnect: () => {
        setIsConnected(true);
        // Re-join room on reconnect
        hasJoinedRoom.current = false;
        if (socket.connected) {
          console.log('[useGameState] re-joining room after reconnect', { roomId, socketId: socket.id });
          socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId });
          hasJoinedRoom.current = true;
        }
      },
      onConnectError: (error) => {
        console.error('[useGameState] connection error', { error: error.message, roomId });
        setIsConnected(false);
      },
      onDisconnect: (reason) => {
        console.warn('[useGameState] disconnected', { reason, roomId });
        setIsConnected(false);
        hasJoinedRoom.current = false;
      },
    });

    // Listen for game state updates
    const handleGameStateUpdate = (data: GameStateData) => {
      console.log('[useGameState] game state updated:', data);
      setGameState(data.state);
      if (data.puzzleContent) {
        setPuzzleContent(data.puzzleContent);
      }
    };

    socket.on(SOCKET_EVENTS.GAME_STATE_UPDATED, handleGameStateUpdate);

    // If already connected, join room immediately
    if (socket.connected && !hasJoinedRoom.current) {
      console.log('[useGameState] socket already connected, joining room', { roomId, socketId: socket.id });
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId });
      hasJoinedRoom.current = true;
    }

    // Cleanup on unmount
    return () => {
      console.log('[useGameState] cleanup', { roomId });
      socket.off(SOCKET_EVENTS.GAME_STATE_UPDATED, handleGameStateUpdate);
      detachLifecycle();
      
      // Leave room before releasing socket
      if (hasJoinedRoom.current && socket.connected) {
        socket.emit(SOCKET_EVENTS.ROOM_LEAVE, { roomId });
      }
      hasJoinedRoom.current = false;
      
      releaseSocket(socket);
      socketRef.current = null;
    };
  }, [roomId]);

  const startGame = useCallback((content: PuzzleContent) => {
    const socket = socketRef.current;
    if (!socket || !isSocketConnected(socket)) {
      console.warn('[useGameState] cannot start game: socket not connected', { roomId });
      return;
    }
    
    console.log('[useGameState] starting game', { roomId, puzzleContent: content });
    
    // Optimistically update local state for responsive UI
    setGameState('Started');
    setPuzzleContent(content);
    
    // Emit with acknowledgment callback
    socket.emit(
      SOCKET_EVENTS.GAME_STARTED, 
      { roomId, puzzleContent: content },
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          console.log('[useGameState] game started successfully');
        } else {
          console.error('[useGameState] failed to start game:', response.error);
          // Revert optimistic update on failure
          setGameState('NotStarted');
          setPuzzleContent(null);
        }
      }
    );
  }, [roomId]);

  const resetGame = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !isSocketConnected(socket)) {
      console.warn('[useGameState] cannot reset game: socket not connected', { roomId });
      return;
    }
    
    console.log('[useGameState] resetting game', { roomId });
    
    // Optimistically update local state
    setGameState('NotStarted');
    setPuzzleContent(null);
    
    // Emit with acknowledgment callback
    socket.emit(
      SOCKET_EVENTS.GAME_RESET,
      { roomId },
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          console.log('[useGameState] game reset successfully');
        } else {
          console.error('[useGameState] failed to reset game:', response.error);
        }
      }
    );
  }, [roomId]);

  return {
    gameState,
    puzzleContent,
    isConnected,
    startGame,
    resetGame,
  };
}
