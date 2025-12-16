import type { AnswerType, MessageId } from './messages.js';

/**
 * Game + session types
 */

export type GameState = 'NotStarted' | 'Started' | 'Ended';

export type GameStartMode = 'random' | 'custom';

export type GameStartRequest =
  | { mode: 'random' }
  | { mode: 'custom'; puzzleContent: PuzzleContent };

export interface PuzzleFact {
  id: string;
  text: string;
  revealed: boolean;
}

export interface PuzzleKeyword {
  id: string;
  text: string;
  revealed: boolean;
}

export interface PuzzleContent {
  soupSurface: string;
  soupTruth: string;
  facts?: PuzzleFact[];
  keywords?: PuzzleKeyword[];
}

/**
 * Public-facing puzzle content safe to send to clients (no truth leakage).
 */
export interface PuzzleContentPublic {
  soupSurface: string;
  facts?: PuzzleFact[];
  keywords?: PuzzleKeyword[];
}

export interface GameStateData {
  /**
   * Optional session identifier; multi-session servers should set this
   * to help clients ignore unrelated room events.
   */
  sessionId?: string;
  state: GameState;
  puzzleContent?: PuzzleContentPublic;
}

export type GameSessionId = string;

/**
 * Lightweight summary safe for lobby displays (no truth leakage)
 */
export interface PuzzleSummary {
  soupSurface?: string;
  facts?: PuzzleFact[];
  keywords?: PuzzleKeyword[];
}

export interface GameSession {
  id: GameSessionId;
  title?: string;
  state: GameState;
  hostNickname?: string;
  createdAt: string;
  updatedAt: string;
  playerCount: number;
  puzzleSummary?: PuzzleSummary;
  /**
   * Indicates the session is usable (not cleaned up or expired).
   * This is separate from the game lifecycle (NotStarted/Started/Ended).
   */
  isActive: boolean;
}

export interface GameSessionSnapshot extends GameSession {
  puzzleContent?: PuzzleContentPublic;
}

export interface SessionQuestionHistoryEntry {
  messageId?: MessageId;
  question: string;
  answer: AnswerType;
  timestamp: string;
  thumbsDown?: boolean;
}

/**
 * Persisted chat message for restoring session state across reconnects.
 * Mirrors the server-side shape to keep chat history serializable.
 */
export interface SessionChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  nickname?: string;
  replyToId?: string;
  replyToPreview?: string;
  replyToNickname?: string;
  timestamp: string;
  answer?: AnswerType;
  answerTip?: string;
}
