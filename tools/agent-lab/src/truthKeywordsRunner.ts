import { extractTruthKeywords } from '@vibe-ltp/llm-client';
import type {
  TruthKeywordCase,
  TruthKeywordRunResult,
  TruthKeywordRunnerOptions,
} from './types.js';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

export async function runTruthKeywordSuite(
  options: TruthKeywordRunnerOptions
): Promise<TruthKeywordRunResult[]> {
  const { cases, model, fallbackModel, systemPrompt } = options;
  const runs: TruthKeywordRunResult[] = [];

  for (const puzzle of cases) {
    const startedAt = Date.now();
    let keywords: string[] = [];
    let error: string | undefined;

    try {
      const result = await extractTruthKeywords(
        { surface: puzzle.surface, truth: puzzle.truth },
        {
          model,
          fallbackModel,
          systemPrompt,
        }
      );

      keywords = result.keywords;
    } catch (err) {
      error = toErrorMessage(err);
    }

    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;

    runs.push({
      caseId: puzzle.id,
      keywords,
      surface: puzzle.surface,
      truth: puzzle.truth,
      durationMs,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      error,
    });
  }

  return runs;
}

export function logTruthKeywordResults(results: TruthKeywordRunResult[]): void {
  console.log('\n[Agent Lab] Truth keywords extractor results');

  results.forEach(result => {
    const status = result.error ? 'error' : result.keywords.length > 0 ? 'ok' : 'empty';
    console.log(`• [${status}] case=${result.caseId} (${result.durationMs}ms)`);
    if (result.surface) {
      console.log(`   surface: ${result.surface}`);
    }
    if (result.truth) {
      console.log(`   truth: ${result.truth}`);
    }

    if (result.error) {
      console.log(`   error: ${result.error}`);
    } else if (result.keywords.length > 0) {
      result.keywords.forEach((keyword, idx) => {
        console.log(`   ${idx + 1}. ${keyword}`);
      });
    }
  });
}
