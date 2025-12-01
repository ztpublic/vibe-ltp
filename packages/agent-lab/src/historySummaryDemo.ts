import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { loadHistorySummaryFixtures } from './fixtures/loadHistorySummaries.js';
import { logHistorySummaryResults, runHistorySummarySuite } from './historySummaryRunner.js';

const rootEnvPath = resolve(process.cwd(), '..', '..', '.env');
dotenv.config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined,
  override: false,
});

async function main() {
  console.log('[Agent Lab] Running history message summarizer demo...\n');

  const model = 'x-ai/grok-4-fast';
  const cases = await loadHistorySummaryFixtures();

  const results = await runHistorySummarySuite({
    model,
    cases,
  });

  logHistorySummaryResults(results);
}

main().catch(error => {
  console.error('History summarizer demo failed:', error);
  process.exit(1);
});
