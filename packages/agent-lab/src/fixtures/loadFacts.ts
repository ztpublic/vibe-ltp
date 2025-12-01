import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FactCase } from '../types.js';

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)));

async function readFactFile(filePath: string): Promise<FactCase[]> {
  const contents = await readFile(filePath, 'utf-8');
  const parsed = JSON.parse(contents) as any[];

  return parsed.map(item => ({
    id: item.id,
    truth: item.context?.truth ?? item.truth,
  }));
}

export async function loadFactFixtures(): Promise<FactCase[]> {
  // Reuse connection fixtures for now since they contain the truth payloads we need
  const files = (await readdir(fixturesDir)).filter(name => name.endsWith('connectionCases.json'));
  const cases: FactCase[] = [];

  for (const file of files) {
    const fileCases = await readFactFile(join(fixturesDir, file));
    cases.push(...fileCases);
  }

  return cases;
}
