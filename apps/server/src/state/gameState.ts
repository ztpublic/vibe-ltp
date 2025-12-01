/**
 * Global Game State Manager
 * 
 * Manages state for the single-session puzzle game architecture.
 * Unlike multi-session systems, this maintains one global game state
 * shared across all connected clients.
 * 
 * Key Features:
 * - State transition validation (prevents invalid state changes)
 * - Message history with automatic trimming (prevents memory growth)
 * - Question history for context building
 * 
 * @remarks
 * This replaces the Session domain model approach for architectural simplicity.
 * All state is ephemeral - persisted only in memory during server runtime.
 */

import type { GameState, PuzzleContent } from '@vibe-ltp/shared';
import type { Embedding } from '@vibe-ltp/llm-client';

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
let truthKeywordEmbeddings: Embedding[] = [];

/**
 * Message history configuration
 * Limits prevent unbounded memory growth in long-running sessions
 */
const MAX_CHAT_HISTORY = 200;
const MAX_QUESTION_HISTORY = 100;

/**
 * Question history for building context summaries
 */
interface QuestionHistory {
  question: string;
  answer: string;
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
 * Validate state transition before applying
 * Prevents invalid state changes that could break game flow
 * 
 * Valid transitions:
 * - NotStarted -> Started (requires puzzle content)
 * - Started -> NotStarted (reset operation)
 * 
 * @throws Error if transition is invalid
 */
function validateStateTransition(from: GameState, to: GameState): void {
  // Cannot restart an already started game without resetting first
  if (from === 'Started' && to === 'Started') {
    throw new Error('Game already started. Reset before starting new game.');
  }
  
  // Cannot start game without puzzle content
  if (to === 'Started' && !globalPuzzleContent) {
    throw new Error('Cannot start game without puzzle content.');
  }
}

/**
 * Set game state with validation
 * 
 * @throws Error if state transition is invalid
 */
export function setGameState(state: GameState): void {
  validateStateTransition(globalGameState, state);
  globalGameState = state;
}

/**
 * Set puzzle content
 */
export function setPuzzleContent(content: PuzzleContent | undefined): void {
  globalPuzzleContent = content;
}

/**
 * Store embeddings for the current puzzle keywords
 */
export function setKeywordEmbeddings(embeddings: Embedding[]): void {
  truthKeywordEmbeddings = embeddings;
}

/**
 * Retrieve embeddings for current puzzle keywords
 */
export function getKeywordEmbeddings(): readonly Embedding[] {
  return truthKeywordEmbeddings;
}

/**
 * Add a question to history
 * Automatically trims history if it exceeds MAX_QUESTION_HISTORY
 * 
 * @param question - The question text
 * @param answer - The answer type (yes/no/irrelevant/both/unknown)
 */
export function addQuestionToHistory(question: string, answer: string): void {
  questionHistory.push({
    question,
    answer,
    timestamp: new Date(),
  });
  
  // Trim history if exceeds limit (keep most recent)
  if (questionHistory.length > MAX_QUESTION_HISTORY) {
    questionHistory = questionHistory.slice(-MAX_QUESTION_HISTORY);
  }
}

/**
 * Get conversation history in the format expected by PuzzleContext
 * Returns array of {question, answer} pairs
 */
export function getConversationHistory(): Array<{ question: string; answer: string }> {
  return questionHistory.map(item => ({
    question: item.question,
    answer: item.answer,
  }));
}

/**
 * Get question history
 */
export function getQuestionHistory(): readonly QuestionHistory[] {
  return questionHistory;
}

/**
 * Add a chat message to history
 * Automatically trims history if it exceeds MAX_CHAT_HISTORY
 * 
 * @param message - The persisted chat message to add
 */
export function addChatMessage(message: PersistedMessage): void {
  chatMessages.push(message);
  
  // Trim history if exceeds limit (keep most recent)
  if (chatMessages.length > MAX_CHAT_HISTORY) {
    chatMessages = chatMessages.slice(-MAX_CHAT_HISTORY);
  }
}

/**
 * Get all chat messages
 */
export function getChatMessages(): readonly PersistedMessage[] {
  return chatMessages;
}

/**
 * Reset game state and history
 * Note: Chat messages are preserved to maintain conversation history
 */
export function resetGameState(): void {
  globalGameState = 'NotStarted';
  globalPuzzleContent = undefined;
  questionHistory = [];
  truthKeywordEmbeddings = [];
  // Do NOT clear chatMessages - preserve conversation history including truth reveal
}

/**
 * Clear all state including chat messages (for testing only)
 */
export function clearAllState(): void {
  globalGameState = 'NotStarted';
  globalPuzzleContent = undefined;
  questionHistory = [];
  chatMessages = [];
  truthKeywordEmbeddings = [];
}
