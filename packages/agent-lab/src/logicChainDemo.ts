import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { loadConnectionFixtures } from './fixtures/loadConnections.js';
import { logLogicChainResults, runLogicChainGeneratorSuite } from './logicChainRunner.js';

const rootEnvPath = resolve(process.cwd(), '..', '..', '.env');
dotenv.config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined,
  override: false,
});

async function main() {
  console.log('[Agent Lab] Running logic chain generator experiments...\n');

  const model = 'x-ai/grok-4-fast';
  const cases = await loadConnectionFixtures();

  const results = await runLogicChainGeneratorSuite({
    model,
    cases,
  });

  logLogicChainResults(results);
}

main().catch(error => {
  console.error('Logic chain generator experiment failed:', error);
  process.exit(1);
});
