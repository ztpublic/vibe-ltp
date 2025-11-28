/**
 * Tool Definition Helper
 * Utilities for defining tools with Zod schemas
 */

import { z, type ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { AgentTool } from './types.js';

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
