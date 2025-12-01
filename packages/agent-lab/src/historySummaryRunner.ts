import { summarizePuzzleHistory } from '@vibe-ltp/llm-client';
import type {
  HistorySummaryCase,
  HistorySummaryRunResult,
  HistorySummaryRunnerOptions,
} from './types.js';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

export async function runHistorySummarySuite(
  options: HistorySummaryRunnerOptions
): Promise<HistorySummaryRunResult[]> {
  const { cases, model, fallbackModel, systemPrompt } = options;
  const runs: HistorySummaryRunResult[] = [];

  for (const puzzle of cases) {
    const startedAt = Date.now();
    let summary = '';
    let error: string | undefined;

    try {
      const result = await summarizePuzzleHistory(
        {
          surface: puzzle.surface,
          conversationHistory: puzzle.conversationHistory,
        },
        {
          model,
          fallbackModel,
          systemPrompt,
        }
      );

      summary = result.summary;
    } catch (err) {
      error = toErrorMessage(err);
    }

    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;

    runs.push({
      caseId: puzzle.id,
      summary,
      durationMs,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      error,
    });
  }

  return runs;
}

export function logHistorySummaryResults(results: HistorySummaryRunResult[]): void {
  console.log('\n[Agent Lab] History summarizer results');

  results.forEach(result => {
    const status = result.error ? 'error' : result.summary ? 'ok' : 'empty';
    console.log(`• [${status}] case=${result.caseId} (${result.durationMs}ms)`);

    if (result.error) {
      console.log(`   error: ${result.error}`);
    } else if (result.summary) {
      console.log(`   summary: ${result.summary}`);
    }
  });
}
