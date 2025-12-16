import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PuzzleContent, PuzzleContentPublic } from '@vibe-ltp/shared';

type RawPuzzle = {
  puzzleSurface?: string;
  puzzleTruth?: string;
};

export interface PuzzleCatalogEntry {
  id: string;
  soupSurface: string;
  soupTruth: string;
}

const DATA_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../packages/data/puzzles'
);

let puzzleCatalogPromise: Promise<PuzzleCatalogEntry[]> | null = null;

function normalizePuzzle(
  item: RawPuzzle,
  source: string,
  index: number
): PuzzleCatalogEntry | null {
  const soupSurface = item.puzzleSurface?.trim();
  const soupTruth = item.puzzleTruth?.trim();

  if (!soupSurface || !soupTruth) {
    console.warn(
      `[puzzleCatalog] Missing content for ${source} puzzle index ${index}`
    );
    return null;
  }

  return { id: `${source}:${index}`, soupSurface, soupTruth };
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

export async function loadPuzzleCatalog(): Promise<PuzzleCatalogEntry[]> {
  if (!puzzleCatalogPromise) {
    puzzleCatalogPromise = (async () => {
      const sources = [
        { fileName: 'puzzles-1.json', source: 'puzzles-1' },
        { fileName: 'puzzles-2.json', source: 'puzzles-2' },
      ] as const;

      const rawSets = await Promise.all(
        sources.map((entry) => loadRawPuzzles(entry.fileName))
      );

      return rawSets.flatMap((raw, sourceIndex) => {
        const source =
          sources[sourceIndex]?.source ?? `puzzles-${sourceIndex + 1}`;
        return raw
          .map((item, index) => normalizePuzzle(item, source, index))
          .filter((entry): entry is PuzzleCatalogEntry => Boolean(entry));
      });
    })();
  }

  return puzzleCatalogPromise;
}

export async function listPuzzles(): Promise<
  Array<{ id: string; puzzleContent: PuzzleContentPublic }>
> {
  const catalog = await loadPuzzleCatalog();
  return catalog.map((entry) => ({
    id: entry.id,
    puzzleContent: { soupSurface: entry.soupSurface },
  }));
}

export async function getPuzzleById(
  id: string
): Promise<PuzzleContent | undefined> {
  const catalog = await loadPuzzleCatalog();
  const match = catalog.find((entry) => entry.id === id);
  if (!match) return undefined;
  return { soupSurface: match.soupSurface, soupTruth: match.soupTruth };
}
