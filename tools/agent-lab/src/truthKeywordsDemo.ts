import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { loadTruthKeywordFixtures } from './fixtures/loadTruthKeywords.js';
import { logTruthKeywordResults, runTruthKeywordSuite } from './truthKeywordsRunner.js';

const rootEnvPath = resolve(process.cwd(), '..', '..', '.env');
dotenv.config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined,
  override: false,
});

async function main() {
  console.log('[Agent Lab] Running truth keywords extractor demo...\n');

  const model = 'x-ai/grok-4-fast';
  const cases = await loadTruthKeywordFixtures();

  const results = await runTruthKeywordSuite({
    model,
    cases,
  });

  logTruthKeywordResults(results);
}

main().catch(error => {
  console.error('Truth keywords extractor demo failed:', error);
  process.exit(1);
});

