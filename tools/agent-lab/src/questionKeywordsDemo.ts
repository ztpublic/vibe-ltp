import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { extractQuestionKeywords } from '@vibe-ltp/llm-client';

const rootEnvPath = resolve(process.cwd(), '..', '..', '.env');
dotenv.config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined,
  override: false,
});

async function main() {
  console.log('[Agent Lab] Question keywords extracter demo\n');

  const questions = [
    process.argv[2] ?? '受害者在警报响起前离开房间了吗？',
    '事故发生时窗户本来就是打开的吗？',
    '厨师是否在刻意隐藏某个秘密配料？',
  ];

  const model = 'x-ai/grok-4-fast';

  for (const question of questions) {
    console.log(`Question: "${question}"`);
    try {
      const result = await extractQuestionKeywords(question, { model });
      console.log(`  Keywords: ${result.keywords.join(', ') || '(none)'}`);
    } catch (error) {
      console.error('  Failed to extract keywords:', error);
    }
    console.log('');
  }
}

main().catch(error => {
  console.error('Question keywords demo failed:', error);
  process.exit(1);
});
