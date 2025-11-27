/**
 * Chat API types for lateral thinking puzzle interactions
 */

export type ChatRole = 'user' | 'bot' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp: string; // ISO string
}

export interface ChatRequest {
  puzzleId?: string;
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: ChatMessage;
  newState?: Record<string, unknown>; // optional puzzle/session data
}
