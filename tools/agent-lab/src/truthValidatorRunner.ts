import { validateTruthProposal } from '@vibe-ltp/llm-client';
import type {
  TruthValidationCase,
  TruthValidationRunResult,
  TruthValidationRunnerOptions,
} from './types.js';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

export async function runTruthValidatorSuite(
  options: TruthValidationRunnerOptions
): Promise<TruthValidationRunResult[]> {
  const { model, fallbackModel, systemPrompt, cases } = options;
  const runs: TruthValidationRunResult[] = [];

  for (const testCase of cases) {
    const startedAt = Date.now();
    let feedback: string | undefined;
    let error: string | undefined;

    try {
      const result = await validateTruthProposal(
        {
          proposedTruth: testCase.proposal,
          actualTruth: testCase.truth,
          surface: testCase.surface,
        },
        {
          model,
          fallbackModel,
          systemPrompt,
        }
      );

      feedback = result.feedback;
    } catch (err) {
      error = toErrorMessage(err);
    }

    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;

    runs.push({
      caseId: testCase.id,
      proposal: testCase.proposal,
      feedback,
      durationMs,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      error,
    });
  }

  return runs;
}

export function logTruthValidatorResults(results: TruthValidationRunResult[]): void {
  console.log('\n[Agent Lab] Truth validator results');

  results.forEach(result => {
    const status = result.error ? 'error' : 'ok';

    console.log(`• [${status}] case=${result.caseId} (${result.durationMs}ms)`);

    if (result.feedback) {
      console.log(`   feedback: ${result.feedback}`);
    }

    if (result.error) {
      console.log(`   error: ${result.error}`);
    }
  });
}
