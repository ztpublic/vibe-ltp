/**
 * Agent Runner
 * Implements agentic workflows with tool calling support
 */

import { generateText } from 'ai';
import { getOpenRouterClient } from './client.js';
import type { AgentRunOptions, AgentRunResult, ChatMessage, ToolMessage, ToolCall } from './types.js';

/**
 * Run an agentic workflow with tool calling
 * Follows OpenRouter's pattern: request → tool execution → request with results
 * 
 * @param options - Configuration for the agent run
 * @returns Result containing final text and conversation history
 */
export async function runAgent(options: AgentRunOptions): Promise<AgentRunResult> {
  const { model, systemPrompt, messages, tools, maxSteps = 4 } = options;
  const openRouter = getOpenRouterClient();

  // Convert tools to the format expected by the AI SDK
  const aiTools: Record<string, any> = {};
  for (const tool of tools) {
    aiTools[tool.name] = {
      description: tool.description,
      parameters: tool.parameters,
      execute: tool.execute,
    };
  }

  const conversationHistory: Array<ChatMessage | ToolMessage> = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  let toolCallsExecuted = 0;

  for (let step = 0; step < maxSteps; step++) {
    try {
      const result = await generateText({
        model: openRouter(model) as any,
        messages: conversationHistory.map(m => ({
          role: m.role as any,
          content: m.content,
          ...(m.role === 'tool' && 'tool_call_id' in m ? { tool_call_id: m.tool_call_id, name: m.name } : {}),
        })),
        tools: aiTools,
      });

      // If we got a text response, we're done
      if (result.text) {
        conversationHistory.push({
          role: 'assistant',
          content: result.text,
        });

        return {
          messages: conversationHistory,
          finalText: result.text,
          toolCallsExecuted,
        };
      }

      // If there are tool calls, execute them
      if (result.toolCalls && result.toolCalls.length > 0) {
        // Add assistant message with tool calls
        conversationHistory.push({
          role: 'assistant',
          content: '',
        });

        // Execute each tool and add results
        for (const toolCall of result.toolCalls) {
          const tool = tools.find(t => t.name === toolCall.toolName);
          if (!tool) {
            console.warn(`Tool not found: ${toolCall.toolName}`);
            continue;
          }

          try {
            const toolResult = await tool.execute(toolCall.args);
            toolCallsExecuted++;

            // Add tool result message
            const toolMessage: ToolMessage = {
              role: 'tool',
              content: JSON.stringify(toolResult),
              tool_call_id: toolCall.toolCallId,
              name: toolCall.toolName,
            };
            conversationHistory.push(toolMessage);
          } catch (error) {
            console.error(`Error executing tool ${toolCall.toolName}:`, error);
            conversationHistory.push({
              role: 'tool',
              content: JSON.stringify({ error: 'Tool execution failed' }),
              tool_call_id: toolCall.toolCallId,
              name: toolCall.toolName,
            });
          }
        }

        // Continue to next step
        continue;
      }

      // No text and no tool calls - shouldn't happen, but handle it
      break;
    } catch (error) {
      console.error('Error in agent step:', error);
      throw new Error('Failed to execute agent workflow');
    }
  }

  // If we exhausted maxSteps
  return {
    messages: conversationHistory,
    finalText: 'I had trouble completing this request in the allotted steps.',
    toolCallsExecuted,
  };
}
