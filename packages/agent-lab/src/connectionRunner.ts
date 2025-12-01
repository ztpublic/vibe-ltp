import { distillPuzzleConnections } from '@vibe-ltp/llm-client';
import type {
  ConnectionCase,
  ConnectionDistillerRunResult,
  ConnectionDistillerRunnerOptions,
} from './types.js';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

export async function runConnectionDistillerSuite(
  options: ConnectionDistillerRunnerOptions
): Promise<ConnectionDistillerRunResult[]> {
  const { cases, model, fallbackModel, systemPrompt } = options;
  const runs: ConnectionDistillerRunResult[] = [];

  for (const puzzle of cases) {
    const startedAt = Date.now();
    let connections: string[] = [];
    let error: string | undefined;

    try {
      const result = await distillPuzzleConnections(puzzle.context, {
        model,
        fallbackModel,
        systemPrompt,
      });

      connections = result.connections;
    } catch (err) {
      error = toErrorMessage(err);
    }

    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;

    runs.push({
      caseId: puzzle.id,
      connections,
      durationMs,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      error,
    });
  }

  return runs;
}

export function logConnectionResults(results: ConnectionDistillerRunResult[]): void {
  console.log('\n[Agent Lab] Connection distiller results');

  results.forEach(result => {
    const status = result.error ? 'error' : result.connections.length > 0 ? 'ok' : 'empty';
    console.log(`• [${status}] case=${result.caseId} (${result.durationMs}ms)`);

    if (result.error) {
      console.log(`   error: ${result.error}`);
    } else if (result.connections.length > 0) {
      result.connections.forEach((conn, idx) => {
        console.log(`   ${idx + 1}. ${conn}`);
      });
    }
  });
}
