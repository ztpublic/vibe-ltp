import { distillPuzzleLogicChain } from '@vibe-ltp/llm-client';
import type { ConnectionCase, LogicChainRunResult, LogicChainRunnerOptions } from './types.js';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

export async function runLogicChainGeneratorSuite(
  options: LogicChainRunnerOptions
): Promise<LogicChainRunResult[]> {
  const { cases, model, fallbackModel, systemPrompt } = options;
  const runs: LogicChainRunResult[] = [];

  for (const puzzle of cases) {
    const startedAt = Date.now();
    let chain: string[] = [];
    let error: string | undefined;

    try {
      const result = await distillPuzzleLogicChain(puzzle.context, {
        model,
        fallbackModel,
        systemPrompt,
      });

      chain = result.chain;
    } catch (err) {
      error = toErrorMessage(err);
    }

    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;

    runs.push({
      caseId: puzzle.id,
      chain,
      durationMs,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      error,
    });
  }

  return runs;
}

export function logLogicChainResults(results: LogicChainRunResult[]): void {
  console.log('\n[Agent Lab] Logic chain generator results');

  results.forEach(result => {
    const status = result.error ? 'error' : result.chain.length > 0 ? 'ok' : 'empty';
    console.log(`• [${status}] case=${result.caseId} (${result.durationMs}ms)`);

    if (result.error) {
      console.log(`   error: ${result.error}`);
    } else if (result.chain.length > 0) {
      result.chain.forEach((link, idx) => {
        console.log(`   ${idx + 1}. ${link}`);
      });
    }
  });
}
