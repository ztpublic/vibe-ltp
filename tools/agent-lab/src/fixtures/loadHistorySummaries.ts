import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HistorySummaryCase } from '../types.js';

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)));

async function readHistorySummaryFile(filePath: string): Promise<HistorySummaryCase[]> {
  const contents = await readFile(filePath, 'utf-8');
  const parsed = JSON.parse(contents) as HistorySummaryCase[];

  return parsed.map(item => ({
    id: item.id,
    surface: item.surface,
    conversationHistory: item.conversationHistory ?? [],
  }));
}

export async function loadHistorySummaryFixtures(): Promise<HistorySummaryCase[]> {
  const files = (await readdir(fixturesDir)).filter(name => name.endsWith('historySummaryCases.json'));
  const cases: HistorySummaryCase[] = [];

  for (const file of files) {
    const fileCases = await readHistorySummaryFile(join(fixturesDir, file));
    cases.push(...fileCases);
  }

  return cases;
}
