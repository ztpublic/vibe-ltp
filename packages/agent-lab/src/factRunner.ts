import { distillPuzzleFacts } from '@vibe-ltp/llm-client';
import type {
  FactCase,
  FactDistillerRunResult,
  FactDistillerRunnerOptions,
} from './types.js';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

export async function runFactDistillerSuite(
  options: FactDistillerRunnerOptions
): Promise<FactDistillerRunResult[]> {
  const { cases, model, fallbackModel, systemPrompt } = options;
  const runs: FactDistillerRunResult[] = [];

  for (const puzzle of cases) {
    const startedAt = Date.now();
    let facts: string[] = [];
    let error: string | undefined;

    try {
      const result = await distillPuzzleFacts(puzzle.truth, {
        model,
        fallbackModel,
        systemPrompt,
      });

      facts = result.facts;
    } catch (err) {
      error = toErrorMessage(err);
    }

    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;

    runs.push({
      caseId: puzzle.id,
      facts,
      durationMs,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      error,
      notes: puzzle.notes,
    });
  }

  return runs;
}

export function logFactResults(results: FactDistillerRunResult[]): void {
  console.log('\n[Agent Lab] Fact distiller results');

  results.forEach(result => {
    const status = result.error ? 'error' : result.facts.length === 3 ? 'ok' : 'incomplete';
    console.log(`• [${status}] case=${result.caseId} (${result.durationMs}ms)`);

    if (result.notes) {
      console.log(`   notes: ${result.notes}`);
    }

    if (result.error) {
      console.log(`   error: ${result.error}`);
    } else if (result.facts.length > 0) {
      result.facts.forEach((fact, idx) => {
        console.log(`   ${idx + 1}. ${fact}`);
      });
    }
  });
}
