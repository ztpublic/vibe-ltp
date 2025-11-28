'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type GameState, type GameStateData, type PuzzleContent } from '@vibe-ltp/shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export function useGameState(roomId: string = 'default') {
  const [gameState, setGameState] = useState<GameState>('NotStarted');
  const [puzzleContent, setPuzzleContent] = useState<PuzzleContent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      
      // Join the room
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId });
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Listen for game state updates
    socket.on(SOCKET_EVENTS.GAME_STATE_UPDATED, (data: GameStateData) => {
      console.log('Game state updated:', data);
      setGameState(data.state);
      if (data.puzzleContent) {
        setPuzzleContent(data.puzzleContent);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.emit(SOCKET_EVENTS.ROOM_LEAVE, { roomId });
      socket.disconnect();
    };
  }, [roomId]);

  const startGame = useCallback((content: PuzzleContent) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(SOCKET_EVENTS.GAME_STARTED, { roomId, puzzleContent: content });
    }
  }, [roomId, isConnected]);

  const resetGame = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(SOCKET_EVENTS.GAME_RESET, { roomId });
      setPuzzleContent(null);
    }
  }, [roomId, isConnected]);

  return {
    gameState,
    puzzleContent,
    isConnected,
    startGame,
    resetGame,
  };
}
