import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { loadConnectionFixtures } from './fixtures/loadConnections.js';
import { logConnectionResults, runConnectionDistillerSuite } from './connectionRunner.js';

const rootEnvPath = resolve(process.cwd(), '..', '..', '.env');
dotenv.config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined,
  override: false,
});

async function main() {
  console.log('[Agent Lab] Running connection distiller experiments...\n');

  const model = process.env.LLM_MODEL_ID ?? 'x-ai/grok-4.1-fast:free';
  const cases = await loadConnectionFixtures();

  const results = await runConnectionDistillerSuite({
    model,
    cases,
  });

  logConnectionResults(results);
}

main().catch(error => {
  console.error('Connection distiller experiment failed:', error);
  process.exit(1);
});
