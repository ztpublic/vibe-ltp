import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TruthValidationCase } from '../types.js';

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)));
const CASE_FILE = join(fixturesDir, 'truthValidatorCases.json');

export async function loadTruthValidatorFixtures(): Promise<TruthValidationCase[]> {
  const contents = await readFile(CASE_FILE, 'utf-8');
  const parsed = JSON.parse(contents) as any[];

  return parsed.map(item => ({
    id: item.id,
    surface: item.surface,
    truth: item.truth,
    proposal: item.proposal,
    expectedVerdict: item.expectedVerdict,
  }));
}
