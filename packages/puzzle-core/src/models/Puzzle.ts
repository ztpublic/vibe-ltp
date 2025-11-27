import type { Puzzle as SharedPuzzle, PuzzleDifficulty } from '@vibe-ltp/shared';

/**
 * Domain model for Puzzle
 * Pure TypeScript, framework-free
 */

export class Puzzle implements SharedPuzzle {
  constructor(
    public readonly id: string,
    public readonly soupSurface: string,
    public readonly soupBottom: string,
    public readonly tags: string[],
    public readonly difficulty: PuzzleDifficulty,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly sourceLanguage?: string
  ) {}

  /**
   * Check if puzzle has a specific tag
   */
  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  /**
   * Get a sanitized version of the puzzle (without solution)
   */
  getSurfaceOnly(): Omit<Puzzle, 'soupBottom'> {
    const { soupBottom: _excluded, ...rest } = this;
    return rest;
  }
}
