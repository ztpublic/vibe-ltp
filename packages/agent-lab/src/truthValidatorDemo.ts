import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { loadTruthValidatorFixtures } from './fixtures/loadTruthValidator.js';
import { logTruthValidatorResults, runTruthValidatorSuite } from './truthValidatorRunner.js';

const rootEnvPath = resolve(process.cwd(), '..', '..', '.env');
dotenv.config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined,
  override: false,
});

async function main() {
  console.log('[Agent Lab] Running truth validator demo...\n');

  const model = 'x-ai/grok-4-fast';
  const cases = await loadTruthValidatorFixtures();

  const results = await runTruthValidatorSuite({
    model,
    cases,
  });

  logTruthValidatorResults(results);
}

main().catch(error => {
  console.error('Truth validator demo failed:', error);
  process.exit(1);
});
