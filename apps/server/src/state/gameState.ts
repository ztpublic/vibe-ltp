/**
 * Global Game State Manager
 * Centralized state for the single-page puzzle game
 */

import type { GameState, PuzzleContent } from '@vibe-ltp/shared';

/**
 * Persisted chat message for UI restoration
 */
export interface PersistedMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  nickname?: string;
  replyToId?: string;
  replyToPreview?: string;
  replyToNickname?: string;
  timestamp: string;
}

/**
 * Global game state
 */
let globalGameState: GameState = 'NotStarted';
let globalPuzzleContent: PuzzleContent | undefined;

/**
 * Question history for building context summaries
 */
interface QuestionHistory {
  question: string;
  answer: string;
  tips?: string;
  timestamp: Date;
}

let questionHistory: QuestionHistory[] = [];

/**
 * Chat message history for UI restoration
 */
let chatMessages: PersistedMessage[] = [];

/**
 * Get current game state
 */
export function getGameState(): GameState {
  return globalGameState;
}

/**
 * Get current puzzle content
 */
export function getPuzzleContent(): PuzzleContent | undefined {
  return globalPuzzleContent;
}

/**
 * Set game state
 */
export function setGameState(state: GameState): void {
  globalGameState = state;
}

/**
 * Set puzzle content
 */
export function setPuzzleContent(content: PuzzleContent | undefined): void {
  globalPuzzleContent = content;
}

/**
 * Add a question to history
 */
export function addQuestionToHistory(question: string, answer: string, tips?: string): void {
  questionHistory.push({
    question,
    answer,
    tips,
    timestamp: new Date(),
  });
}

/**
 * Get question history
 */
export function getQuestionHistory(): readonly QuestionHistory[] {
  return questionHistory;
}

/**
 * Generate a summary of what players have learned so far
 * This helps keep the agent context compact (agent-flow.md section C2)
 */
export function getHistorySummary(): string {
  if (questionHistory.length === 0) {
    return '';
  }

  const summaryLines: string[] = [];
  
  for (const item of questionHistory) {
    if (item.answer === 'yes') {
      summaryLines.push(`✓ ${item.question}`);
    } else if (item.answer === 'no') {
      summaryLines.push(`✗ ${item.question}`);
    }
    // Skip irrelevant/both/unknown for summary brevity
  }

  return summaryLines.join('\n');
}

/**
 * Add a chat message to history
 */
export function addChatMessage(message: PersistedMessage): void {
  chatMessages.push(message);
}

/**
 * Get all chat messages
 */
export function getChatMessages(): readonly PersistedMessage[] {
  return chatMessages;
}

/**
 * Reset game state and history
 */
export function resetGameState(): void {
  globalGameState = 'NotStarted';
  globalPuzzleContent = undefined;
  questionHistory = [];
  chatMessages = [];
}
