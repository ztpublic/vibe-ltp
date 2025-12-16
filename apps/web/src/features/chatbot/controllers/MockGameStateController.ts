/**
 * MockGameStateController
 * Test implementation of GameStateController with local state only
 */

'use client';

import { useState, useCallback } from 'react';
import type { GameState, GameStartRequest, PuzzleContentPublic } from '@vibe-ltp/shared';
import type { GameStateController } from './GameStateController';

export interface MockGameStateControllerOptions {
  gameState?: GameState;
  puzzleContent?: PuzzleContentPublic | null;
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
  const [puzzleContent, setPuzzleContent] = useState<PuzzleContentPublic | null>(
    options?.puzzleContent || null
  );
  const [isConnected] = useState<boolean>(options?.isConnected ?? true);
  const sessionId = options?.sessionId ?? 'mock-session';

  const startGame = useCallback((request: GameStartRequest) => {
    setGameState('Started');
    setPuzzleContent(
      request.mode === 'custom'
        ? {
            soupSurface: request.puzzleContent.soupSurface,
            facts: request.puzzleContent.facts,
            keywords: request.puzzleContent.keywords,
          }
        : null,
    );
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
