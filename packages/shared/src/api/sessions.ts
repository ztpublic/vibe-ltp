import type {
  GameSession,
  GameSessionId,
  GameSessionSnapshot,
  GameState,
  PuzzleContent,
  SessionChatMessage,
  SessionQuestionHistoryEntry,
} from '../types/game.js';

/**
 * Session HTTP contracts
 */
export interface CreateSessionRequest {
  title?: string;
  hostNickname?: string;
  /**
   * Optional puzzle seed for host-created sessions.
   * If omitted, the session starts in a lobby state until a host provides content.
   */
  puzzleContent?: PuzzleContent;
}

export interface CreateSessionResponse {
  session: GameSession;
}

export interface ListSessionsResponse {
  sessions: GameSession[];
}

export interface StartSessionRequest {
  puzzleContent: PuzzleContent;
}

export interface EndSessionRequest {
  revealContent?: boolean;
  preserveChat?: boolean;
}

export interface GetSessionResponse {
  session: GameSessionSnapshot;
  chatHistory?: SessionChatMessage[];
  questionHistory?: SessionQuestionHistoryEntry[];
}

export interface JoinSessionRequest {
  nickname?: string;
}

export interface SessionStateUpdate {
  sessionId: GameSessionId;
  state: GameState;
  puzzleContent?: PuzzleContent;
  updatedAt?: string;
}

export interface SessionChatHistorySync {
  sessionId: GameSessionId;
  messages: SessionChatMessage[];
}

export interface SessionListUpdatePayload {
  sessions: GameSession[];
}

export interface SessionRemovedPayload {
  sessionId: GameSessionId;
}
