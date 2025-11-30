/**
 * Game state types
 */

export type GameState = 'NotStarted' | 'Started';

export interface PuzzleFact {
  id: string;
  text: string;
  revealed: boolean;
}

export interface PuzzleContent {
  soupSurface: string;
  soupTruth: string;
  facts?: PuzzleFact[];
}

export interface GameStateData {
  state: GameState;
  puzzleContent?: PuzzleContent;
}
