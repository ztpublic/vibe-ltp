import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { generatePuzzle } from '@vibe-ltp/llm-client';

const rootEnvPath = resolve(process.cwd(), '..', '..', '.env');
dotenv.config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined,
  override: false,
});

function readPromptFromArgs(): string | undefined {
  const raw = process.argv.slice(2).join(' ').trim();
  return raw.length > 0 ? raw : undefined;
}

function readCountFromEnv(): number {
  const raw = (process.env.PUZZLE_COUNT ?? '').trim();
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.min(Math.floor(parsed), 10);
}

async function main() {
  console.log('[Agent Lab] Puzzle generator demo\n');

  const model = process.env.OPENROUTER_MODEL?.trim() || 'x-ai/grok-4-fast';
  const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL?.trim() || undefined;

  const promptFromArgs = readPromptFromArgs();
  const promptFromEnv = process.env.PUZZLE_PROMPT?.trim() || undefined;
  const prompt = promptFromArgs ?? promptFromEnv;
  const count = readCountFromEnv();

  if (prompt) {
    console.log(`Prompt: ${prompt}`);
  }

  for (let i = 0; i < count; i += 1) {
    if (count > 1) {
      console.log(`\n--- Puzzle ${i + 1}/${count} ---`);
    }

    const result = await generatePuzzle(prompt ? { prompt } : {}, { model, fallbackModel });
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch(error => {
  console.error('Puzzle generator demo failed:', error);
  process.exit(1);
});
