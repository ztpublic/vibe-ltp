import { type AnswerType, validatePuzzleQuestion } from '@vibe-ltp/llm-client';
import type {
  AgentVariant,
  ExperimentCase,
  ExperimentRunnerOptions,
  ExperimentRunResult,
  ExperimentSuiteResult,
  ExperimentSummary,
} from './types.js';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

function summarizeRuns(runs: ExperimentRunResult[], agents: AgentVariant[]): ExperimentSummary[] {
  return agents.map(agent => {
    const agentRuns = runs.filter(run => run.agentId === agent.id);
    const matched = agentRuns.filter(run => run.matchesExpected === true).length;
    const mismatched = agentRuns.filter(run => run.matchesExpected === false).length;
    const missingExpected = agentRuns.filter(run => run.expectedAnswer === undefined).length;
    const errors = agentRuns.filter(run => run.error).length;
    const averageDurationMs =
      agentRuns.length > 0
        ? Math.round(agentRuns.reduce((total, run) => total + run.durationMs, 0) / agentRuns.length)
        : 0;

    return {
      agentId: agent.id,
      agentLabel: agent.label,
      total: agentRuns.length,
      matched,
      mismatched,
      missingExpected,
      errors,
      averageDurationMs,
    };
  });
}

export async function runQuestionValidatorSuite(options: ExperimentRunnerOptions): Promise<ExperimentSuiteResult> {
  const { agents, cases } = options;
  const runs: ExperimentRunResult[] = [];

  for (const agent of agents) {
    for (const testCase of cases) {
      const startedAt = Date.now();
      let answer: AnswerType | undefined;
      let tip: string | undefined;
      let error: string | undefined;

      try {
        const evaluation = await validatePuzzleQuestion(testCase.question, testCase.context, {
          model: agent.model,
          fallbackModel: agent.fallbackModel,
          systemPrompt: agent.systemPrompt,
        });

        answer = evaluation.answer;
        tip = evaluation.tip;
      } catch (err) {
        error = toErrorMessage(err);
      }

      const completedAt = Date.now();
      const durationMs = completedAt - startedAt;
      const matchesExpected =
        error || testCase.expectedAnswer === undefined ? undefined : answer === testCase.expectedAnswer;

      runs.push({
        agentId: agent.id,
        agentLabel: agent.label,
        caseId: testCase.id,
        question: testCase.question,
        answer,
        tip,
        expectedAnswer: testCase.expectedAnswer,
        matchesExpected,
        durationMs,
        startedAt: new Date(startedAt).toISOString(),
        completedAt: new Date(completedAt).toISOString(),
        error,
      });
    }
  }

  return {
    runs,
    summary: summarizeRuns(runs, agents),
  };
}

export function logSuiteResult(result: ExperimentSuiteResult): void {
  console.log('\n[Agent Lab] Summary by agent');
  result.summary.forEach(summary => {
    console.log(
      `- ${summary.agentLabel} (${summary.agentId}): total=${summary.total}, matched=${summary.matched}, mismatched=${summary.mismatched}, missingExpected=${summary.missingExpected}, errors=${summary.errors}, avgDuration=${summary.averageDurationMs}ms`
    );
  });

  console.log('\n[Agent Lab] Detailed runs');
  result.runs.forEach(run => {
    const status = run.error
      ? 'error'
      : run.matchesExpected === true
        ? 'matched'
        : run.matchesExpected === false
          ? 'mismatch'
          : 'no-expected';

    console.log(
      `• [${status}] agent=${run.agentId} case=${run.caseId} answer=${run.answer ?? 'n/a'} expected=${run.expectedAnswer ?? 'n/a'} (${run.durationMs}ms)`
    );

    if (run.tip) {
      console.log(`   tip: ${run.tip}`);
    }

    if (run.error) {
      console.log(`   error: ${run.error}`);
    }
  });
}
