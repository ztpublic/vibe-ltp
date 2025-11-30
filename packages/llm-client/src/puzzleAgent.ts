/**
 * Puzzle Agent
 * Implements the lateral thinking puzzle host workflow
 * Following the agent-flow.md specification
 */

import { generateText } from 'ai';
import { getOpenRouterClient } from './client.js';
import { createEvaluateQuestionTool, EvaluateQuestionArgsSchema, type EvaluateQuestionArgs } from './tools.js';
import type { ChatMessage } from './types.js';

/**
 * Question-answer pair in conversation history
 */
export interface QuestionAnswerPair {
  question: string;
  answer: string;
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
export interface PuzzleEvaluationResult {
  /** The canonical answer type */
  answer: 'yes' | 'no' | 'irrelevant' | 'both' | 'unknown';
}

/**
 * Build the system prompt for the puzzle host agent
 * Following the guidelines from agent-flow.md section C
 */
function buildSystemPrompt(): string {
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
 * Evaluate a puzzle question using the agent workflow
 * This is the main entry point for the simplified agent (agent-flow.md section D)
 * 
 * @param question - The player's question
 * @param context - Puzzle context (surface, truth, conversationHistory)
 * @param model - LLM model to use
 * @param fallbackModel - Fallback LLM model to use if primary model fails
 * @returns Evaluation result with answer
 */
export async function evaluatePuzzleQuestion(
  question: string,
  context: PuzzleContext,
  model: string = 'x-ai/grok-4.1-fast:free',
  fallbackModel: string = 'google/gemini-2.0-flash-exp:free'
): Promise<PuzzleEvaluationResult> {
  const openRouter = getOpenRouterClient();
  const evaluateTool = createEvaluateQuestionTool();

  // Build messages following agent-flow.md structure
  const systemPrompt = buildSystemPrompt();
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
      parameters: EvaluateQuestionArgsSchema, // Pass Zod schema directly
      execute: async (args: any) => await evaluateTool.execute(args),
    },
  };

  console.log('\n[Puzzle Agent]');
  console.log('Input:', question);

  // Helper function to call LLM with tool
  const callModel = async (modelToUse: string) => {
    const result = await generateText({
      model: openRouter(modelToUse) as any,
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
        };
      }
    }

    // Fallback if no tool call (shouldn't happen with proper prompt)
    console.log('Output: UNKNOWN (no tool call)');
    
    return {
      answer: 'unknown' as const,
    };
  };

  try {
    // Try with primary model
    return await callModel(model);
  } catch (primaryError) {
    console.warn(`⚠️ Primary model (${model}) failed, trying fallback model (${fallbackModel})...`, primaryError);
    
    try {
      // Retry with fallback model
      return await callModel(fallbackModel);
    } catch (fallbackError) {
      console.error('❌ Both primary and fallback models failed');
      console.error('Primary error:', primaryError);
      console.error('Fallback error:', fallbackError);
      
      // Shorten error messages to 50 chars max
      const primaryMsg = String(primaryError).slice(0, 50);
      const fallbackMsg = String(fallbackError).slice(0, 50);
      
      throw new Error(`Failed to evaluate puzzle question: Primary(${primaryMsg}), Fallback(${fallbackMsg})`);
    }
  }
}

/**
 * Format the evaluation result as a chat reply
 * Following agent-flow.md section D2, step 5
 */
export function formatEvaluationReply(result: PuzzleEvaluationResult): string {
  const answerLabels = {
    yes: '是',
    no: '否',
    irrelevant: '无关',
    both: '两者都是',
    unknown: '未知',
  };

  return answerLabels[result.answer];
}
