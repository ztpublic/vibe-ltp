/**
 * Question Validator Agent
 * Validates player questions against the puzzle truth
 * Following the agent-flow.md specification
 */

import { generateText } from 'ai';
import { callWithFallbackModel } from './fallback.js';
import { openRouterLanguageModel } from './models.js';
import { createEvaluateQuestionTool, type EvaluateQuestionArgs, type AnswerType } from './tools.js';
import type { ChatMessage } from './types.js';

/**
 * Question-answer pair in conversation history
 */
export interface QuestionAnswerPair {
  question: string;
  answer: AnswerType;
}

/**
 * Context for puzzle evaluation
 */
export interface PuzzleContext {
  /** The puzzle surface (汤面) - what players see */
  surface: string;
  /** The puzzle truth/solution (汤底) - the full story */
  truth: string;
  /** Structured conversation history as question-answer pairs */
  conversationHistory: QuestionAnswerPair[];
}

/**
 * Result of evaluating a question against the puzzle
 */
export interface QuestionValidationResult {
  /** The canonical answer type */
  answer: AnswerType;
  /** Optional hint surfaced by the agent */
  tip?: string;
}

/**
 * Configuration options for running the question validator agent
 */
export interface QuestionValidatorOptions {
  /** Primary model to call (required) */
  model: string;
  /** Fallback model if primary fails */
  fallbackModel?: string;
  /** Override system prompt for experiments */
  systemPrompt?: string;
}

/**
 * Build the system prompt for the question validator agent
 * Following the guidelines from agent-flow.md section C
 */
export function buildQuestionValidatorSystemPrompt(): string {
  return `You are a lateral thinking puzzle host (situation puzzle / 海龟汤).

ROLE & RULES:
- Players only see the puzzle surface description. You know the full true story.
- Players ask yes/no questions about the surface. You must judge how the host should answer.
- Your goal is to guide players towards the INTENDED story, not just any plausible story.
- The only valid outputs are via the tool "evaluate_question_against_truth" with answer in {yes, no, irrelevant, both, unknown} and an optional tips string.

ANSWER SEMANTICS:
- "yes": The question's proposition is correct and relevant to the solution
- "no": The proposition is incorrect or clearly false
- "irrelevant": The answer doesn't matter for solving the puzzle (standard in situation puzzles)
- "both": Both yes and no apply in different senses that matter to the puzzle
- "unknown": The truth doesn't specify, or any yes/no would be misleading

OUTPUT FORMAT REQUIREMENT:
You MUST always respond ONLY by calling the tool "evaluate_question_against_truth". Do not chat directly to the user.`;
}

/**
 * Build context messages for the LLM
 * Following agent-flow.md section C1
 */
function buildContextMessages(context: PuzzleContext): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // Add puzzle surface
  messages.push({
    role: 'assistant',
    content: `PUZZLE SURFACE (汤面):\n${context.surface}`,
  });

  // Add puzzle truth
  messages.push({
    role: 'assistant',
    content: `PUZZLE TRUTH (汤底):\n${context.truth}`,
  });

  // Add latest 10 conversation history entries if available
  if (context.conversationHistory.length > 0) {
    const recentHistory = context.conversationHistory.slice(-10);
    const historyText = recentHistory
      .map(item => `Q: ${item.question}\nA: ${item.answer}`)
      .join('\n\n');
    
    messages.push({
      role: 'assistant',
      content: `RECENT CONVERSATION HISTORY (latest 10):\n${historyText}`,
    });
  }

  return messages;
}

/**
 * Validate a puzzle question using the agent workflow
 * This is the main entry point for the simplified agent (agent-flow.md section D)
 * 
 * @param question - The player's question
 * @param context - Puzzle context (surface, truth, conversationHistory)
 * @param modelOrOptions - Required LLM model to use, or options bag (model required)
 * @param fallbackModel - Optional fallback LLM model to use if primary model fails (only used when modelOrOptions is string)
 * @returns Evaluation result with answer
 */
export async function validatePuzzleQuestion(
  question: string,
  context: PuzzleContext,
  modelOrOptions: string | QuestionValidatorOptions,
  fallbackModel?: string
): Promise<QuestionValidationResult> {
  const options: QuestionValidatorOptions =
    typeof modelOrOptions === 'string'
      ? { model: modelOrOptions, fallbackModel }
      : modelOrOptions;

  if (!options || !options.model) {
    throw new Error('Question validator agent requires a model to be specified.');
  }

  const model = options.model;
  const fallbackModelToUse = options.fallbackModel;
  const systemPrompt = options.systemPrompt ?? buildQuestionValidatorSystemPrompt();

  const evaluateTool = createEvaluateQuestionTool();

  // Build messages following agent-flow.md structure
  const contextMessages = buildContextMessages(context);
  
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...contextMessages,
    { role: 'user' as const, content: question },
  ];

  // Convert tool to AI SDK format - AI SDK expects Zod schemas directly
  const aiTools = {
    [evaluateTool.name]: {
      description: evaluateTool.description,
      parameters: evaluateTool.parameters,
    },
  };

  console.log('\n[Question Validator Agent]');
  console.log('Input:', question);

  // Helper function to call LLM with tool
  const callModel = async (modelToUse: string) => {
    const result = await generateText({
      model: openRouterLanguageModel(modelToUse),
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      tools: aiTools,
      maxSteps: 1, // Single step - we only need the tool call
    });

    // Extract tool call result
    if (result.toolCalls && result.toolCalls.length > 0) {
      const toolCall = result.toolCalls[0];
      if (toolCall) {
        const args = toolCall.args as EvaluateQuestionArgs;
        
        console.log('Output:', args.answer.toUpperCase());

        return {
          answer: args.answer,
          tip: args.tips,
        };
      }
    }

    // Fallback if no tool call (shouldn't happen with proper prompt)
    console.log('Output: UNKNOWN (no tool call)');
    
    return {
      answer: 'unknown' as const,
    };
  };

  return callWithFallbackModel({
    operation: 'validate puzzle question',
    model,
    fallbackModel: fallbackModelToUse,
    call: callModel,
  });
}

/**
 * Format the validation result as a chat reply
 * Following agent-flow.md section D2, step 5
 */
export function formatValidationReply(result: QuestionValidationResult): string {
  const answerLabels: Record<AnswerType, string> = {
    yes: '是',
    no: '否',
    irrelevant: '无关',
    both: '两者都是',
    unknown: '未知',
  };

  return answerLabels[result.answer] ?? '未知';
}
