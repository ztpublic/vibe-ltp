import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TruthKeywordCase } from '../types.js';

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)));

async function readTruthKeywordFile(filePath: string): Promise<TruthKeywordCase[]> {
  const contents = await readFile(filePath, 'utf-8');
  const parsed = JSON.parse(contents) as any[];

  return parsed
    .filter(item => item.context?.truth && item.context?.surface)
    .map(item => ({
      id: item.id,
      surface: item.context.surface,
      truth: item.context.truth,
    }));
}

async function readSeaTurtleSoups(): Promise<TruthKeywordCase[]> {
  const rootDir = resolve(fixturesDir, '../../..', '..'); // repo root
  const filePath = join(rootDir, 'apps', 'web', 'tests', 'e2e', 'sea_turtle_soups.json');

  try {
    const contents = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(contents) as Array<{ soupSurface?: string; soupBottom?: string }>;

    return parsed
      .filter(item => item.soupSurface && item.soupBottom)
      .map((item, idx) => ({
        id: `sea-turtle-${idx + 1}`,
        surface: item.soupSurface!,
        truth: item.soupBottom!,
      }));
  } catch (error) {
    console.warn(`[Agent Lab] Could not load sea_turtle_soups.json: ${String(error)}`);
    return [];
  }
}

export async function loadTruthKeywordFixtures(): Promise<TruthKeywordCase[]> {
  // Reuse connection fixtures to get paired surface/truth payloads
  const files = (await readdir(fixturesDir)).filter(name => name.endsWith('connectionCases.json'));
  const cases: TruthKeywordCase[] = [];

  for (const file of files) {
    const fileCases = await readTruthKeywordFile(join(fixturesDir, file));
    cases.push(...fileCases);
  }

  const seaTurtleSoups = await readSeaTurtleSoups();

  return [...cases, ...seaTurtleSoups];
}
