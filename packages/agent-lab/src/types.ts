import type { AnswerType, PuzzleContext, QuestionAnswerPair } from '@vibe-ltp/llm-client';

export interface AgentVariant {
  id: string;
  label: string;
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

export interface ExperimentCase {
  id: string;
  question: string;
  context: PuzzleContext;
  expectedAnswer?: AnswerType;
}

export interface ExperimentRunResult {
  agentId: string;
  agentLabel: string;
  caseId: string;
  question: string;
  answer?: AnswerType;
  tip?: string;
  expectedAnswer?: AnswerType;
  matchesExpected?: boolean;
  durationMs: number;
  startedAt: string;
  completedAt: string;
  error?: string;
}

export interface ExperimentSummary {
  agentId: string;
  agentLabel: string;
  total: number;
  matched: number;
  mismatched: number;
  missingExpected: number;
  errors: number;
  averageDurationMs: number;
}

export interface ExperimentSuiteResult {
  runs: ExperimentRunResult[];
  summary: ExperimentSummary[];
}

export interface ExperimentRunnerOptions {
  agents: AgentVariant[];
  cases: ExperimentCase[];
}

export interface ConnectionCase {
  id: string;
  context: PuzzleContext;
}

export interface ConnectionDistillerRunResult {
  caseId: string;
  connections: string[];
  durationMs: number;
  startedAt: string;
  completedAt: string;
  error?: string;
}

export interface ConnectionDistillerRunnerOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
  cases: ConnectionCase[];
}

export interface FactCase {
  id: string;
  truth: string;
}

export interface FactDistillerRunResult {
  caseId: string;
  facts: string[];
  durationMs: number;
  startedAt: string;
  completedAt: string;
  error?: string;
}

export interface FactDistillerRunnerOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
  cases: FactCase[];
}

export interface KeyPointMatchCase {
  id: string;
  question: string;
  answer: AnswerType;
  keyPoints: string[];
  expectedMatchedIndexes?: number[];
}

export interface KeyPointMatchRunResult {
  caseId: string;
  matchedIndexes: number[];
  durationMs: number;
  startedAt: string;
  completedAt: string;
  error?: string;
  expectedMatchedIndexes?: number[];
}

export interface KeyPointMatchRunnerOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
  cases: KeyPointMatchCase[];
}

export interface HistorySummaryCase {
  id: string;
  surface: string;
  conversationHistory: QuestionAnswerPair[];
}

export interface HistorySummaryRunResult {
  caseId: string;
  summary: string;
  durationMs: number;
  startedAt: string;
  completedAt: string;
  error?: string;
}

export interface HistorySummaryRunnerOptions {
  model: string;
  fallbackModel?: string;
  systemPrompt?: string;
  cases: HistorySummaryCase[];
}
