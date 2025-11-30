import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ConnectionCase } from '../types.js';

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)));

async function readConnectionFile(filePath: string): Promise<ConnectionCase[]> {
  const contents = await readFile(filePath, 'utf-8');
  const parsed = JSON.parse(contents) as ConnectionCase[];

  return parsed.map(item => ({
    id: item.id,
    notes: item.notes,
    context: {
      surface: item.context.surface,
      truth: item.context.truth,
      conversationHistory: [],
    },
  }));
}

export async function loadConnectionFixtures(): Promise<ConnectionCase[]> {
  const files = (await readdir(fixturesDir)).filter(name => name.endsWith('connectionCases.json'));
  const cases: ConnectionCase[] = [];

  for (const file of files) {
    const fileCases = await readConnectionFile(join(fixturesDir, file));
    cases.push(...fileCases);
  }

  return cases;
}
