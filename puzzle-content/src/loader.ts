import type { PuzzleDifficulty } from '@vibe-ltp/shared';

/**
 * Raw puzzle data structure from JSON files
 */
export interface RawPuzzleData {
  soupSurface: string;
  soupBottom: string;
  tags: string[];
  difficulty: PuzzleDifficulty;
  sourceLanguage?: string;
}

/**
 * Load puzzle data from JSON files
 */
export async function loadPuzzles(category: string): Promise<RawPuzzleData[]> {
  try {
    const data = await import(`./data/${category}.json`);
    return data.default || data;
  } catch (error) {
    console.error(`Failed to load puzzles from category: ${category}`, error);
    return [];
  }
}

/**
 * Load all available puzzle categories
 */
export function getAllCategories(): string[] {
  return ['classic', 'horror', 'sci-fi'];
}
