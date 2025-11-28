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
 * Tool for evaluating puzzle questions against the truth
 * This is the core tool for the lateral thinking puzzle agent
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
