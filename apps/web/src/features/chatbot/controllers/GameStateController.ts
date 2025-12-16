/**
 * GameStateController Interface
 * Abstract interface for game state management that can be implemented with real or mock behavior
 */

import type { GameState, GameStartRequest, PuzzleContentPublic } from '@vibe-ltp/shared';

export interface GameStateController {
  /** Current game state (NotStarted, Started) */
  gameState: GameState;
  
  /** Current puzzle data */
  puzzleContent: PuzzleContentPublic | null;
  
  /** Connection status indicator */
  isConnected: boolean;

  /** Session identifier the controller is bound to */
  sessionId: string;
  
  /** Initiate a new game session */
  startGame: (request: GameStartRequest) => void;
  
  /** Reset game to initial state */
  resetGame: () => void;
}
