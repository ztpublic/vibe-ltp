import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { loadCaseFixtures, logSuiteResult, runQuestionValidatorSuite, sampleAgents } from './index.js';

// Load workspace root .env so OpenRouter key is available
const rootEnvPath = resolve(process.cwd(), '..', '..', '.env');
dotenv.config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined,
  override: false,
});

async function main() {
  console.log('[Agent Lab] Running sample question validator experiments...\n');

  const cases = await loadCaseFixtures();

  const result = await runQuestionValidatorSuite({
    agents: sampleAgents,
    cases,
  });

  logSuiteResult(result);
}

main().catch(error => {
  console.error('Sample experiment run failed:', error);
  process.exit(1);
});
