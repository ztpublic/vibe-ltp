/**
 * Shared types for puzzles
 */

export enum PuzzleDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

export interface Puzzle {
  id: string;
  soupSurface: string;
  soupBottom: string;
  tags: string[];
  difficulty: PuzzleDifficulty;
  sourceLanguage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PuzzleCreateInput {
  soupSurface: string;
  soupBottom: string;
  tags: string[];
  difficulty: PuzzleDifficulty;
  sourceLanguage?: string;
}

export interface PuzzleUpdateInput {
  soupSurface?: string;
  soupBottom?: string;
  tags?: string[];
  difficulty?: PuzzleDifficulty;
  sourceLanguage?: string;
}
