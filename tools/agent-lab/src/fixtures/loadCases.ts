import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AnswerType } from '@vibe-ltp/llm-client';
import type { ExperimentCase } from '../types.js';

const fixturesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'cases'
);

interface RawCaseContext {
  surface: string;
  truth: string;
  conversationHistory?: unknown; // ignored for fixtures
}

interface RawCase {
  id: string;
  question: string;
  expectedAnswer?: AnswerType;
  context: RawCaseContext;
}

async function readCaseFile(filePath: string): Promise<ExperimentCase[]> {
  const contents = await readFile(filePath, 'utf-8');
  const parsed = JSON.parse(contents) as RawCase[];

  return parsed.map(item => ({
    id: item.id,
    question: item.question,
    expectedAnswer: item.expectedAnswer,
    context: {
      surface: item.context.surface,
      truth: item.context.truth,
      conversationHistory: [],
    },
  }));
}

export async function loadCaseFixtures(): Promise<ExperimentCase[]> {
  const files = (await readdir(fixturesDir)).filter(name => name.endsWith('.json'));
  const cases: ExperimentCase[] = [];

  for (const file of files) {
    const fileCases = await readCaseFile(join(fixturesDir, file));
    cases.push(...fileCases);
  }

  return cases;
}
