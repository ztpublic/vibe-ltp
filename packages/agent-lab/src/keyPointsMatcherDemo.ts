import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { logKeyPointMatchResults, runKeyPointMatcherSuite } from './keyPointsMatcherRunner.js';
import type { KeyPointMatchCase } from './types.js';

const rootEnvPath = resolve(process.cwd(), '..', '..', '.env');
dotenv.config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined,
  override: false,
});

const demoCases: KeyPointMatchCase[] = [
  {
    id: 'broken-match-height',
    surface: '在沙漠深处，一个男人的尸体躺在地上，背着一个背包，手里握着一根被折断的火柴。附近散落着几件行李。',
    summary:
      '已知他与他人同乘某种飞行交通工具后从高处坠落，背包是降落伞但未能救他，现场行李不只属于他一个人。',
    keyPoints: [
      '沙漠里的那些行李并不是他一个人的行李。',
      '他和这些行李、火柴原本是在同一次旅行中一起被运送的。',
      '他不是自己步行进入沙漠深处的，而是从高处来到现在的位置。',
      '那盒火柴曾被当作一种随机选人的工具，而不是单纯用来点火。',
      '被折断的那半根火柴是所有火柴中唯一被特意改动、用来标记“被选中者”的一根。',
    ],
    expectedMatchedIndexes: [0, 2],
  },
];

async function main() {
  console.log('[Agent Lab] Running key points matcher demo...\n');

  const model = 'x-ai/grok-4-fast';

  const results = await runKeyPointMatcherSuite({
    model,
    cases: demoCases,
  });

  logKeyPointMatchResults(results);
}

main().catch(error => {
  console.error('Key points matcher demo failed:', error);
  process.exit(1);
});
