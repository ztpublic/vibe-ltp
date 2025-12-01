import { matchKeyPoints } from '@vibe-ltp/llm-client';
import type { KeyPointMatchCase, KeyPointMatchRunResult, KeyPointMatchRunnerOptions } from './types.js';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

export async function runKeyPointMatcherSuite(
  options: KeyPointMatchRunnerOptions
): Promise<KeyPointMatchRunResult[]> {
  const { cases, model, fallbackModel, systemPrompt } = options;
  const runs: KeyPointMatchRunResult[] = [];

  for (const testCase of cases) {
    const startedAt = Date.now();
    let matchedIndexes: number[] = [];
    const summary = testCase.summary?.trim();
    let error: string | undefined;

    try {
      if (!summary) {
        throw new Error('KeyPointMatchCase.summary is required for matcher demo.');
      }

      const result = await matchKeyPoints(
        {
          summary: summary,
          keyPoints: testCase.keyPoints,
        },
        {
          model,
          fallbackModel,
          systemPrompt,
        }
      );

      matchedIndexes = result.matchedIndexes ?? [];
    } catch (err) {
      error = toErrorMessage(err);
    }

    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;

    runs.push({
      caseId: testCase.id,
      matchedIndexes,
      summary,
      durationMs,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      error,
      expectedMatchedIndexes: testCase.expectedMatchedIndexes,
    });
  }

  return runs;
}

export function logKeyPointMatchResults(results: KeyPointMatchRunResult[]): void {
  console.log('\n[Agent Lab] Key points matcher results');

  results.forEach(result => {
    const status = result.error
      ? 'error'
      : result.expectedMatchedIndexes
        ? JSON.stringify(result.matchedIndexes) === JSON.stringify(result.expectedMatchedIndexes)
          ? 'matched'
          : 'mismatch'
        : result.matchedIndexes.length > 0
          ? 'ok'
          : 'empty';

    console.log(`• [${status}] case=${result.caseId} (${result.durationMs}ms) matched=${JSON.stringify(result.matchedIndexes)}`);

    if (result.expectedMatchedIndexes) {
      console.log(`   expected: ${JSON.stringify(result.expectedMatchedIndexes)}`);
    }

    if (result.summary) {
      console.log(`   summary: ${result.summary}`);
    }

    if (result.error) {
      console.log(`   error: ${result.error}`);
    }
  });
}
