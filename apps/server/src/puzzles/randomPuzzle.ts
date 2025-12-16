import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PuzzleContent } from '@vibe-ltp/shared';

type RawPuzzle = {
  puzzleSurface?: string;
  puzzleTruth?: string;
};

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../packages/data/puzzles');

let puzzlePoolPromise: Promise<PuzzleContent[]> | null = null;

function normalizePuzzle(item: RawPuzzle, index: number): PuzzleContent | null {
  const soupSurface = item.puzzleSurface?.trim();
  const soupTruth = item.puzzleTruth?.trim();

  if (!soupSurface || !soupTruth) {
    console.warn(`[randomPuzzle] Missing content for puzzle index ${index}`);
    return null;
  }

  return { soupSurface, soupTruth };
}

async function loadRawPuzzles(fileName: string): Promise<RawPuzzle[]> {
  const fullPath = path.join(DATA_DIR, fileName);
  const raw = await readFile(fullPath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid puzzle data: ${fileName}`);
  }
  return parsed as RawPuzzle[];
}

async function loadPuzzlePool(): Promise<PuzzleContent[]> {
  if (!puzzlePoolPromise) {
    puzzlePoolPromise = (async () => {
      const [set1, set2] = await Promise.all([
        loadRawPuzzles('puzzles-1.json'),
        loadRawPuzzles('puzzles-2.json'),
      ]);

      return [...set1, ...set2]
        .map(normalizePuzzle)
        .filter((item): item is PuzzleContent => Boolean(item));
    })();
  }

  return puzzlePoolPromise;
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

