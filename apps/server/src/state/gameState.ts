import { v4 as uuidv4 } from 'uuid';
import {
  DEFAULT_CHAT_HISTORY_LIMIT,
  DEFAULT_QUESTION_HISTORY_LIMIT,
  addChatMessageToSession,
  addQuestionToSession,
  createSessionStateContainer,
  revealPuzzleContent,
} from '@vibe-ltp/puzzle-core';
import type {
  GameSession,
  GameSessionId,
  GameSessionSnapshot,
  GameState,
  PuzzleContent,
  PuzzleSummary,
  SessionChatMessage,
  SessionQuestionHistoryEntry,
} from '@vibe-ltp/shared';
import type { Embedding } from '@vibe-ltp/llm-client';

export const DEFAULT_SESSION_ID: GameSessionId = 'default';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours
const CLEANUP_INTERVAL_MS = 1000 * 60 * 5; // 5 minutes

interface SessionRecord {
  meta: GameSession;
  stateContainer: ReturnType<typeof createSessionStateContainer>;
  keywordEmbeddings: Embedding[];
  lastActiveAt: number;
}

const sessionStore = new Map<GameSessionId, SessionRecord>();

const nowIso = (value = Date.now()): string => new Date(value).toISOString();

function buildPuzzleSummary(puzzle?: PuzzleContent): PuzzleSummary | undefined {
  if (!puzzle) return undefined;
  const { soupSurface, facts, keywords } = puzzle;
  return {
    soupSurface,
    facts,
    keywords,
  };
}

function validateStateTransition(current: GameState, next: GameState, hasPuzzle: boolean): void {
  if (current === 'Started' && next === 'Started') {
    throw new Error('Game already started. Reset before starting new game.');
  }

  if (next === 'Started' && !hasPuzzle) {
    throw new Error('Cannot start game without puzzle content.');
  }
}

function ensureSession(sessionId: GameSessionId): SessionRecord {
  const session = sessionStore.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  return session;
}

function touchSession(sessionId: GameSessionId, at: number = Date.now()): void {
  const session = ensureSession(sessionId);
  session.lastActiveAt = at;
  session.meta.updatedAt = nowIso(at);
}

function setSessionState(sessionId: GameSessionId, state: GameState): void {
  const session = ensureSession(sessionId);
  validateStateTransition(session.stateContainer.state, state, Boolean(session.stateContainer.puzzleContent));
  session.stateContainer = {
    ...session.stateContainer,
    state,
  };
  session.meta.state = state;
  touchSession(sessionId);
}

function setSessionPuzzleContent(sessionId: GameSessionId, content: PuzzleContent | undefined): void {
  const session = ensureSession(sessionId);
  session.stateContainer = {
    ...session.stateContainer,
    puzzleContent: content,
  };
  session.meta.puzzleSummary = buildPuzzleSummary(content);
  touchSession(sessionId);
}

function buildSnapshot(session: SessionRecord): GameSessionSnapshot {
  return {
    ...session.meta,
    puzzleContent: session.stateContainer.puzzleContent,
  };
}

function bumpPlayerCount(sessionId: GameSessionId, delta: number): void {
  const session = ensureSession(sessionId);
  const nextCount = Math.max(0, session.meta.playerCount + delta);
  session.meta.playerCount = nextCount;
  touchSession(sessionId);
}

export interface CreateSessionOptions {
  sessionId?: GameSessionId;
  title?: string;
  hostNickname?: string;
  state?: GameState;
  puzzleContent?: PuzzleContent;
}

export function createSession(options: CreateSessionOptions = {}): GameSessionSnapshot {
  const {
    sessionId = uuidv4(),
    title,
    hostNickname,
    state = 'NotStarted',
    puzzleContent,
  } = options;

  if (sessionStore.has(sessionId)) {
    throw new Error(`Session already exists: ${sessionId}`);
  }

  if (state === 'Started' && !puzzleContent) {
    throw new Error('Cannot start game without puzzle content.');
  }

  const createdAt = nowIso();
  const stateContainer = createSessionStateContainer({
    sessionId,
    state,
    puzzleContent,
    chatHistory: [],
    questionHistory: [],
  });

  const meta: GameSession = {
    id: sessionId,
    title,
    state,
    hostNickname,
    createdAt,
    updatedAt: createdAt,
    playerCount: 0,
    puzzleSummary: buildPuzzleSummary(puzzleContent),
    isActive: true,
  };

  const record: SessionRecord = {
    meta,
    stateContainer,
    keywordEmbeddings: [],
    lastActiveAt: Date.now(),
  };

  sessionStore.set(sessionId, record);
  return buildSnapshot(record);
}

function ensureDefaultSession(): void {
  if (!sessionStore.has(DEFAULT_SESSION_ID)) {
    createSession({ sessionId: DEFAULT_SESSION_ID, title: 'Default Session' });
  }
}

ensureDefaultSession();

export function listSessions(): GameSession[] {
  return Array.from(sessionStore.values()).map((session) => session.meta);
}

export function getSession(sessionId: GameSessionId = DEFAULT_SESSION_ID): GameSessionSnapshot | undefined {
  const session = sessionStore.get(sessionId);
  return session ? buildSnapshot(session) : undefined;
}

export function getGameState(sessionId: GameSessionId = DEFAULT_SESSION_ID): GameState {
  return ensureSession(sessionId).stateContainer.state;
}

export function joinSession(sessionId: GameSessionId = DEFAULT_SESSION_ID): GameSessionSnapshot {
  bumpPlayerCount(sessionId, 1);
  return getSession(sessionId)!;
}

export function leaveSession(sessionId: GameSessionId = DEFAULT_SESSION_ID): GameSessionSnapshot | undefined {
  if (!sessionStore.has(sessionId)) return undefined;
  bumpPlayerCount(sessionId, -1);
  return getSession(sessionId);
}

export function setGameState(state: GameState, sessionId: GameSessionId = DEFAULT_SESSION_ID): void {
  setSessionState(sessionId, state);
}

export function getPuzzleContent(sessionId: GameSessionId = DEFAULT_SESSION_ID): PuzzleContent | undefined {
  return ensureSession(sessionId).stateContainer.puzzleContent;
}

export function setPuzzleContent(content: PuzzleContent | undefined, sessionId: GameSessionId = DEFAULT_SESSION_ID): void {
  setSessionPuzzleContent(sessionId, content);
}

export function startSession(sessionId: GameSessionId, content: PuzzleContent): GameSessionSnapshot {
  setSessionPuzzleContent(sessionId, content);
  setSessionState(sessionId, 'Started');
  return getSession(sessionId)!;
}

export function endSession(
  sessionId: GameSessionId,
  options: { revealContent?: boolean; preserveChat?: boolean } = {},
): GameSessionSnapshot {
  const { revealContent = true, preserveChat = true } = options;
  const session = ensureSession(sessionId);
  const revealedPuzzle = revealContent ? revealPuzzleContent(session.stateContainer.puzzleContent) : undefined;

  session.stateContainer = {
    ...session.stateContainer,
    state: 'Ended',
    puzzleContent: revealedPuzzle,
    chatHistory: preserveChat ? session.stateContainer.chatHistory : [],
  };

  session.meta.state = 'Ended';
  session.meta.puzzleSummary = buildPuzzleSummary(revealedPuzzle);
  touchSession(sessionId);
  return buildSnapshot(session);
}

export function resetGameState(
  sessionId: GameSessionId = DEFAULT_SESSION_ID,
  options: { preserveChat?: boolean; revealExistingContent?: boolean } = {},
): void {
  const { preserveChat = true, revealExistingContent = true } = options;
  const session = ensureSession(sessionId);
  const revealed = revealExistingContent ? revealPuzzleContent(session.stateContainer.puzzleContent) : undefined;

  session.stateContainer = {
    ...session.stateContainer,
    state: 'NotStarted',
    puzzleContent: revealed,
    questionHistory: [],
    chatHistory: preserveChat ? session.stateContainer.chatHistory : [],
  };

  session.keywordEmbeddings = [];
  session.meta.state = 'NotStarted';
  session.meta.puzzleSummary = buildPuzzleSummary(revealed);
  touchSession(sessionId);
}

export function addChatMessage(
  message: SessionChatMessage,
  sessionId: GameSessionId = DEFAULT_SESSION_ID,
  limit = DEFAULT_CHAT_HISTORY_LIMIT,
): void {
  const session = ensureSession(sessionId);
  session.stateContainer = addChatMessageToSession(session.stateContainer, message, limit);
  touchSession(sessionId);
}

export function getChatMessages(sessionId: GameSessionId = DEFAULT_SESSION_ID): readonly SessionChatMessage[] {
  return ensureSession(sessionId).stateContainer.chatHistory;
}

export function addQuestionToHistory(
  question: string,
  answer: SessionQuestionHistoryEntry['answer'],
  sessionId: GameSessionId = DEFAULT_SESSION_ID,
  limit = DEFAULT_QUESTION_HISTORY_LIMIT,
  timestamp: Date = new Date(),
): void {
  const session = ensureSession(sessionId);
  session.stateContainer = addQuestionToSession(session.stateContainer, question, answer, limit, timestamp);
  touchSession(sessionId);
}

export function getQuestionHistory(sessionId: GameSessionId = DEFAULT_SESSION_ID): readonly SessionQuestionHistoryEntry[] {
  return ensureSession(sessionId).stateContainer.questionHistory;
}

export function getConversationHistory(
  sessionId: GameSessionId = DEFAULT_SESSION_ID,
): Array<{ question: string; answer: SessionQuestionHistoryEntry['answer'] }> {
  return ensureSession(sessionId).stateContainer.questionHistory.map((item: SessionQuestionHistoryEntry) => ({
    question: item.question,
    answer: item.answer,
  }));
}

export function setKeywordEmbeddings(embeddings: Embedding[], sessionId: GameSessionId = DEFAULT_SESSION_ID): void {
  const session = ensureSession(sessionId);
  session.keywordEmbeddings = embeddings;
  touchSession(sessionId);
}

export function getKeywordEmbeddings(sessionId: GameSessionId = DEFAULT_SESSION_ID): readonly Embedding[] {
  return ensureSession(sessionId).keywordEmbeddings;
}

export function getDefaultSessionId(): GameSessionId {
  return DEFAULT_SESSION_ID;
}

export function updateSessionActivity(sessionId: GameSessionId, at: number = Date.now()): void {
  touchSession(sessionId, at);
}

export function cleanupIdleSessions(now: number = Date.now()): GameSessionId[] {
  const removed: GameSessionId[] = [];

  for (const [sessionId, session] of sessionStore.entries()) {
    if (sessionId === DEFAULT_SESSION_ID) {
      continue;
    }

    if (now - session.lastActiveAt > SESSION_TTL_MS) {
      session.meta.isActive = false;
      sessionStore.delete(sessionId);
      removed.push(sessionId);
    }
  }

  return removed;
}

const cleanupInterval = setInterval(() => {
  const removed = cleanupIdleSessions();
  if (removed.length > 0) {
    console.log(`[SessionStore] Cleaned up idle sessions: ${removed.join(', ')}`);
  }
}, CLEANUP_INTERVAL_MS);

// Prevent keeping the process alive solely for the cleanup timer
cleanupInterval.unref?.();

export function clearAllState(): void {
  sessionStore.clear();
  ensureDefaultSession();
}
