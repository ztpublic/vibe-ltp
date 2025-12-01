/**
 * Tool Definition Helper
 * Utilities for defining tools with Zod schemas
 */

import { z, type ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { AgentTool } from './types.js';

/**
 * Answer types for puzzle questions (lateral thinking puzzle host)
 */
export const AnswerEnum = z.enum(['yes', 'no', 'irrelevant', 'both', 'unknown']);
export type AnswerType = z.infer<typeof AnswerEnum>;

/**
 * Arguments for evaluate_question_against_truth tool
 */
export const EvaluateQuestionArgsSchema = z.object({
  answer: AnswerEnum.describe(
    'How the host should answer this question: yes (correct), no (incorrect), irrelevant (no impact on solution), both (ambiguous), unknown (cannot be determined from truth)'
  ),
  tips: z.string().optional().describe(
    'Optional brief hint for players to help them ask better questions or focus on relevant aspects'
  ),
});

export type EvaluateQuestionArgs = z.infer<typeof EvaluateQuestionArgsSchema>;

/**
 * Arguments for distill_connections tool
 */
export const DistillConnectionsArgsSchema = z.object({
  connections: z.array(z.string().min(3)).min(1).max(3).describe(
    '1-3 concise bridging statements (ordered from closest to the surface to closest to the truth) that help players infer the true story.'
  ),
});

export type DistillConnectionsArgs = z.infer<typeof DistillConnectionsArgsSchema>;

/**
 * Arguments for distill_facts tool
 */
export const DistillFactsArgsSchema = z.object({
  facts: z.array(z.string().min(3)).min(3).max(5).describe(
    '3-5 essential factual statements that capture the core of the puzzle truth without spoilers.'
  ),
});

export type DistillFactsArgs = z.infer<typeof DistillFactsArgsSchema>;

/**
 * Arguments for distill_logic_chain tool
 */
export const DistillLogicChainArgsSchema = z.object({
  chain: z.array(z.string().min(3)).min(3).max(5).describe(
    '3-5 progressive reasoning steps that form a chain from the surface toward the truth.'
  ),
});

export type DistillLogicChainArgs = z.infer<typeof DistillLogicChainArgsSchema>;

/**
 * Arguments for summarize_history tool
 */
export const SummarizeHistoryArgsSchema = z.object({
  summary: z
    .string()
    .min(10)
    .describe(
      'Concise Chinese summary (2-4 sentences or bullet-style lines) of what is now known or confidently inferred from the surface and Q/A history. Do NOT restate the surface text.'
    ),
});

export type SummarizeHistoryArgs = z.infer<typeof SummarizeHistoryArgsSchema>;

/**
 * Tool for evaluating puzzle questions against the truth
 * This is the core tool for the question validator agent
 */
export function createEvaluateQuestionTool(): AgentTool<EvaluateQuestionArgs, EvaluateQuestionArgs> {
  return defineTool({
    name: 'evaluate_question_against_truth',
    description: 'Evaluate the player\'s question against the puzzle\'s true story. Decide what the host should answer (yes/no/irrelevant/both/unknown), and optionally provide a brief tip that may help players ask better questions.',
    argsSchema: EvaluateQuestionArgsSchema,
    execute: async (args) => {
      // This tool just returns its arguments - the agent uses it for structured output
      return args;
    },
  });
}

/**
 * Tool for distilling puzzle connections to guide players
 */
export function createDistillConnectionsTool(): AgentTool<DistillConnectionsArgs, DistillConnectionsArgs> {
  return defineTool({
    name: 'distill_connections',
    description:
      'Extract 1-3 concise connection statements that bridge the puzzle surface to the underlying truth, ordered from surface-adjacent to truth-adjacent.',
    argsSchema: DistillConnectionsArgsSchema,
    execute: async (args) => args,
  });
}

/**
 * Tool for extracting core facts from the puzzle truth
 */
export function createDistillFactsTool(): AgentTool<DistillFactsArgs, DistillFactsArgs> {
  return defineTool({
    name: 'distill_facts',
    description: 'Extract 3-5 key factual statements that summarize the core of the puzzle truth.',
    argsSchema: DistillFactsArgsSchema,
    execute: async (args) => args,
  });
}

/**
 * Tool for summarizing conversation history against the surface
 */
export function createSummarizeHistoryTool(): AgentTool<SummarizeHistoryArgs, SummarizeHistoryArgs> {
  return defineTool({
    name: 'summarize_history',
    description:
      'Summarize what the host and players collectively know so far based on the puzzle surface and the Q/A history, excluding any details already given in the surface.',
    argsSchema: SummarizeHistoryArgsSchema,
    execute: async (args) => args,
  });
}

/**
 * Arguments for match_key_points tool
 */
export const MatchKeyPointsArgsSchema = z.object({
  matchedIndexes: z
    .array(
      z.coerce
        .number()
        .int()
        .min(0)
    )
    .describe(
      'Zero-based indexes into the provided key points array that should now be considered known to players.'
    ),
});

export type MatchKeyPointsArgs = z.infer<typeof MatchKeyPointsArgsSchema>;

/**
 * Tool for matching player Q/A to distilled key points
 */
export function createMatchKeyPointsTool(): AgentTool<MatchKeyPointsArgs, MatchKeyPointsArgs> {
  return defineTool({
    name: 'match_key_points',
    description:
      'Given the player question, the host answer (yes/no/irrelevant/both/unknown), and the list of distilled key points, select which key points the player would now understand.',
    argsSchema: MatchKeyPointsArgsSchema,
    execute: async (args) => args,
  });
}

/**
 * Tool for generating a progressive logic chain bridging surface to truth
 */
export function createDistillLogicChainTool(): AgentTool<DistillLogicChainArgs, DistillLogicChainArgs> {
  return defineTool({
    name: 'distill_logic_chain',
    description:
      'Generate 3-5 progressive reasoning steps that start from the surface and move toward the truth, each step building on the previous.',
    argsSchema: DistillLogicChainArgsSchema,
    execute: async (args) => args,
  });
}

/**
 * Define a tool with a Zod schema for type-safe argument validation
 * 
 * @example
 * ```ts
 * const greetTool = defineTool({
 *   name: 'greet',
 *   description: 'Greet a user by name',
 *   argsSchema: z.object({ name: z.string() }),
 *   execute: async ({ name }) => `Hello, ${name}!`
 * });
 * ```
 */
export function defineTool<ArgsSchema extends ZodTypeAny, Result>(
  opts: {
    name: string;
    description: string;
    argsSchema: ArgsSchema;
    execute: (args: z.infer<ArgsSchema>) => Promise<Result> | Result;
  }
): AgentTool<z.infer<ArgsSchema>, Result> {
  const jsonSchema = zodToJsonSchema(opts.argsSchema, {
    target: 'openApi3',
  });

  return {
    name: opts.name,
    description: opts.description,
    parameters: jsonSchema as Record<string, unknown>,
    execute: opts.execute,
  };
}
