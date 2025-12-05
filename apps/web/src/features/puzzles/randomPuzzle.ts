import type { PuzzleContent } from '@vibe-ltp/shared';

type RawPuzzle = {
  puzzleSurface?: string;
  puzzleTruth?: string;
};

let puzzlePool: PuzzleContent[] | null = null;

const normalizePuzzle = (item: RawPuzzle, index: number): PuzzleContent | null => {
  const soupSurface = item.puzzleSurface?.trim();
  const soupTruth = item.puzzleTruth?.trim();

  if (!soupSurface || !soupTruth) {
    console.warn(`[randomPuzzle] Missing content for puzzle index ${index}`);
    return null;
  }

  return {
    soupSurface,
    soupTruth,
  };
};

async function loadPuzzlePool(): Promise<PuzzleContent[]> {
  if (puzzlePool) {
    return puzzlePool;
  }

  const [set1, set2] = await Promise.all([
    import('../../../../../packages/data/puzzles/puzzles-1.json'),
    import('../../../../../packages/data/puzzles/puzzles-2.json'),
  ]);

  const combined = [...(set1.default as RawPuzzle[]), ...(set2.default as RawPuzzle[])];
  puzzlePool = combined
    .map(normalizePuzzle)
    .filter((item): item is PuzzleContent => Boolean(item));

  return puzzlePool;
}

export async function pickRandomPuzzle(): Promise<PuzzleContent> {
  const pool = await loadPuzzlePool();
  if (pool.length === 0) {
    throw new Error('No puzzles available from data set');
  }

  const idx = Math.floor(Math.random() * pool.length);
  const puzzle = pool[idx];
  if (!puzzle) {
    throw new Error('Failed to select a random puzzle');
  }

  return puzzle;
}
