import type { PuzzleContent } from '@vibe-ltp/shared';
import { loadPuzzleCatalog } from './puzzleCatalog.js';

export async function pickRandomPuzzle(): Promise<PuzzleContent> {
  const catalog = await loadPuzzleCatalog();
  if (catalog.length === 0) {
    throw new Error('No puzzles available from data set');
  }

  const idx = Math.floor(Math.random() * catalog.length);
  const entry = catalog[idx];
  if (!entry) {
    throw new Error('Failed to select a random puzzle');
  }

  return { soupSurface: entry.soupSurface, soupTruth: entry.soupTruth };
}
