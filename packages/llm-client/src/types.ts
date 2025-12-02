/**
 * LLM Client Types
 * Type definitions for chat messages, tool calls, and agent workflows
 */

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: Exclude<Role, 'tool'>;
  content: string;
  name?: string; // optional assistant/user name
  tool_call_id?: string; // for assistant messages with tool calls
}

export interface ToolMessage {
  role: 'tool';
  content: string;
  tool_call_id: string;
  name: string;
}

// Generic agent tool definition
export interface AgentTool<Args = any, Result = any> {
  name: string;
  description: string;
  // JSON schema for OpenRouter tooling
  parameters: Record<string, unknown>;
  // local executor
  execute: (args: Args) => Promise<Result> | Result;
}

export interface AgentRunOptions {
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  tools: AgentTool<any, any>[];
  maxSteps?: number;
}

export interface AgentRunResult {
  messages: Array<ChatMessage | ToolMessage>;
  finalText: string;
  toolCallsExecuted: number;
}
