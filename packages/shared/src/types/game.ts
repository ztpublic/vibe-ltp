/**
 * Game state types
 */

export type GameState = 'NotStarted' | 'Started';

export interface PuzzleContent {
  soupSurface: string;
  soupTruth: string;
}

export interface GameStateData {
  state: GameState;
  roomId: string;
  puzzleContent?: PuzzleContent;
}
