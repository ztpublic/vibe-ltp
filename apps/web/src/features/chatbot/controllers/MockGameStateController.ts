/**
 * MockGameStateController
 * Test implementation of GameStateController with local state only
 */

'use client';

import { useState, useCallback } from 'react';
import type { GameState, PuzzleContent } from '@vibe-ltp/shared';
import type { GameStateController } from './GameStateController';

export interface MockGameStateControllerOptions {
  gameState?: GameState;
  puzzleContent?: PuzzleContent | null;
  isConnected?: boolean;
  sessionId?: string;
}

/**
 * Hook that provides a mock game state controller for testing
 * No external dependencies, uses local React state only
 */
export function useMockGameStateController(
  options?: MockGameStateControllerOptions
): GameStateController {
  const [gameState, setGameState] = useState<GameState>(options?.gameState || 'NotStarted');
  const [puzzleContent, setPuzzleContent] = useState<PuzzleContent | null>(
    options?.puzzleContent || null
  );
  const [isConnected] = useState<boolean>(options?.isConnected ?? true);
  const sessionId = options?.sessionId ?? 'mock-session';

  const startGame = useCallback((content: PuzzleContent) => {
    setGameState('Started');
    setPuzzleContent(content);
  }, []);

  const resetGame = useCallback(() => {
    setGameState('NotStarted');
    setPuzzleContent(null);
  }, []);

  return {
    gameState,
    puzzleContent,
    isConnected,
    sessionId,
    startGame,
    resetGame,
  };
}
