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
 * Context for puzzle evaluation
 */
export interface PuzzleContext {
  /** The puzzle surface (汤面) - what players see */
  surface: string;
  /** The puzzle truth/solution (汤底) - the full story */
  truth: string;
  /** Optional history summary of what players have learned so far */
  historySummary?: string;
}

/**
 * Result of evaluating a question against the puzzle
 */
export interface PuzzleEvaluationResult {
  /** The canonical answer type */
  answer: 'yes' | 'no' | 'irrelevant' | 'both' | 'unknown';
  /** Optional tips for players */
  tips?: string;
  /** Full conversation history including tool calls */
  conversationHistory: Array<ChatMessage | any>;
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

TIPS GUIDANCE:
- Use tips sparingly to guide players when they're stuck or going off-track
- Tips should be brief hints, not direct answers
- Examples: "Focus on WHERE this happened" or "The time of day matters here"
- Leave tips blank when the question is on the right track

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

  // Add history summary if available
  if (context.historySummary) {
    messages.push({
      role: 'assistant',
      content: `SO FAR, PLAYERS KNOW:\n${context.historySummary}`,
    });
  }

  return messages;
}

/**
 * Evaluate a puzzle question using the agent workflow
 * This is the main entry point for the simplified agent (agent-flow.md section D)
 * 
 * @param question - The player's question
 * @param context - Puzzle context (surface, truth, history)
 * @param model - LLM model to use
 * @returns Evaluation result with answer and optional tips
 */
export async function evaluatePuzzleQuestion(
  question: string,
  context: PuzzleContext,
  model: string = 'x-ai/grok-4.1-fast:free'
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

  console.log('\n🧩 Puzzle Agent - Evaluating Question');
  console.log('═'.repeat(60));
  console.log('📝 Question:', question);
  console.log('🎭 Surface:', context.surface.substring(0, 100) + '...');
  console.log('🔍 Truth:', context.truth.substring(0, 100) + '...');
  if (context.historySummary) {
    console.log('📜 History:', context.historySummary.substring(0, 100) + '...');
  }
  console.log('═'.repeat(60));

  try {
    // Call LLM with tool
    const result = await generateText({
      model: openRouter(model) as any,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      tools: aiTools,
      maxSteps: 1, // Single step - we only need the tool call
    });

    console.log('\n✅ Agent Response:');
    console.log('─'.repeat(60));

    // Extract tool call result
    if (result.toolCalls && result.toolCalls.length > 0) {
      const toolCall = result.toolCalls[0];
      if (toolCall) {
        const args = toolCall.args as EvaluateQuestionArgs;
        
        console.log('📊 Answer:', args.answer.toUpperCase());
        if (args.tips) {
          console.log('💡 Tips:', args.tips);
        }
        console.log('─'.repeat(60));

        return {
          answer: args.answer,
          tips: args.tips,
          conversationHistory: messages,
        };
      }
    }

    // Fallback if no tool call (shouldn't happen with proper prompt)
    console.warn('⚠️  No tool call received from LLM');
    console.log('─'.repeat(60));
    
    return {
      answer: 'unknown',
      tips: 'Unable to evaluate this question.',
      conversationHistory: messages,
    };
  } catch (error) {
    console.error('❌ Error evaluating puzzle question:', error);
    throw new Error('Failed to evaluate puzzle question');
  }
}

/**
 * Format the evaluation result as a chat reply
 * Following agent-flow.md section D2, step 5
 */
export function formatEvaluationReply(result: PuzzleEvaluationResult): string {
  const answerLabels = {
    yes: '是 (Yes)',
    no: '否 (No)',
    irrelevant: '无关 (Irrelevant)',
    both: '两者都是 (Both)',
    unknown: '未知 (Unknown)',
  };

  const answerLine = `**回答: ${answerLabels[result.answer]}**`;
  
  if (result.tips) {
    return `${answerLine}\n\n*${result.tips}*`;
  }
  
  return answerLine;
}
