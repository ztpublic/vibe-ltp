import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { loadFactFixtures } from './fixtures/loadFacts.js';
import { logFactResults, runFactDistillerSuite } from './factRunner.js';

const rootEnvPath = resolve(process.cwd(), '..', '..', '.env');
dotenv.config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined,
  override: false,
});

async function main() {
  console.log('[Agent Lab] Running fact distiller experiments...\n');

  const model = process.env.LLM_MODEL_ID ?? 'x-ai/grok-4.1-fast:free';
  const cases = await loadFactFixtures();

  const results = await runFactDistillerSuite({
    model,
    cases,
  });

  logFactResults(results);
}

main().catch(error => {
  console.error('Fact distiller experiment failed:', error);
  process.exit(1);
});
