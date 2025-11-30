/**
 * GameStateController Interface
 * Abstract interface for game state management that can be implemented with real or mock behavior
 */

import type { GameState, PuzzleContent } from '@vibe-ltp/shared';

export interface GameStateController {
  /** Current game state (NotStarted, Started) */
  gameState: GameState;
  
  /** Current puzzle data */
  puzzleContent: PuzzleContent | null;
  
  /** Connection status indicator */
  isConnected: boolean;
  
  /** Initiate a new game session */
  startGame: (content: PuzzleContent) => void;
  
  /** Reset game to initial state */
  resetGame: () => void;
}
