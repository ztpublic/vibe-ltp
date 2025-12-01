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
    id: 'broken-match',
    question: '他是热死的吗',
    answer: 'no',
    keyPoints: [
      '沙漠里的那些行李并不是他一个人的行李。',
      '他和这些行李、火柴原本是在同一次旅行中一起被运送的。',
      '他不是自己步行进入沙漠深处的，而是从高处来到现在的位置。',
      '那盒火柴曾被当作一种随机选人的工具，而不是单纯用来点火。',
      '被折断的那半根火柴是所有火柴中唯一被特意改动、用来标记“被选中者”的一根。',
    ],
    expectedMatchedIndexes: [],
  },
  {
    id: 'broken-match',
    question: '他是摔死的吗',
    answer: 'yes',
    keyPoints: [
      '沙漠里的那些行李并不是他一个人的行李。',
      '他和这些行李、火柴原本是在同一次旅行中一起被运送的。',
      '他不是自己步行进入沙漠深处的，而是从高处来到现在的位置。',
      '那盒火柴曾被当作一种随机选人的工具，而不是单纯用来点火。',
      '被折断的那半根火柴是所有火柴中唯一被特意改动、用来标记“被选中者”的一根。',
    ],
    expectedMatchedIndexes: [2],
  },
  {
    id: 'broken-match',
    question: '火柴是死者自己折断的吗',
    answer: 'no',
    keyPoints: [
      '沙漠里的那些行李并不是他一个人的行李。',
      '他和这些行李、火柴原本是在同一次旅行中一起被运送的。',
      '他不是自己步行进入沙漠深处的，而是从高处来到现在的位置。',
      '那盒火柴曾被当作一种随机选人的工具，而不是单纯用来点火。',
      '被折断的那半根火柴是所有火柴中唯一被特意改动、用来标记“被选中者”的一根。',
    ],
    expectedMatchedIndexes: [],
  },
  {
    id: 'broken-match',
    question: '行李是死者自己的吗',
    answer: 'no',
    keyPoints: [
      '沙漠里的那些行李并不是他一个人的行李。',
      '他和这些行李、火柴原本是在同一次旅行中一起被运送的。',
      '他不是自己步行进入沙漠深处的，而是从高处来到现在的位置。',
      '那盒火柴曾被当作一种随机选人的工具，而不是单纯用来点火。',
      '被折断的那半根火柴是所有火柴中唯一被特意改动、用来标记“被选中者”的一根。',
    ],
    expectedMatchedIndexes: [0],
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
