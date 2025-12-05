import type {
  AnswerType,
  GameSessionId,
  GameState,
  PuzzleContent,
  SessionChatMessage,
  SessionQuestionHistoryEntry,
} from '@vibe-ltp/shared';

export const DEFAULT_CHAT_HISTORY_LIMIT = 200;
export const DEFAULT_QUESTION_HISTORY_LIMIT = 100;

export interface SessionStateContainer {
  sessionId: GameSessionId;
  state: GameState;
  puzzleContent?: PuzzleContent;
  chatHistory: SessionChatMessage[];
  questionHistory: SessionQuestionHistoryEntry[];
}

export interface SessionStateInit extends Partial<Omit<SessionStateContainer, 'sessionId' | 'state'>> {
  sessionId: GameSessionId;
  state?: GameState;
}

/**
 * Create a new immutable-ish container for session state.
 * Callers should treat this as a value object (replace, don't mutate).
 */
export function createSessionStateContainer(init: SessionStateInit): SessionStateContainer {
  const { sessionId, state = 'NotStarted', puzzleContent, chatHistory = [], questionHistory = [] } = init;

  return {
    sessionId,
    state,
    puzzleContent,
    chatHistory: [...chatHistory],
    questionHistory: [...questionHistory],
  };
}

function trimToLimit<T>(items: readonly T[], limit: number): T[] {
  if (limit <= 0) return [];
  if (items.length <= limit) return [...items];
  return items.slice(-limit);
}

/**
 * Upsert a chat message and trim to the configured limit.
 */
export function upsertChatHistory(
  history: readonly SessionChatMessage[],
  message: SessionChatMessage,
  limit = DEFAULT_CHAT_HISTORY_LIMIT,
): SessionChatMessage[] {
  const next = history.map((item) => (item.id === message.id ? { ...item, ...message } : item));
  const exists = next.some((item) => item.id === message.id);
  const result = exists ? next : [...next, message];
  return trimToLimit(result, limit);
}

/**
 * Append a question/answer pair to history (immutably) and trim to limit.
 */
export function appendQuestionHistory(
  history: readonly SessionQuestionHistoryEntry[],
  question: string,
  answer: AnswerType,
  limit = DEFAULT_QUESTION_HISTORY_LIMIT,
  timestamp: Date = new Date(),
  thumbsDown = false,
): SessionQuestionHistoryEntry[] {
  const next: SessionQuestionHistoryEntry = {
    question,
    answer,
    timestamp: timestamp.toISOString(),
    thumbsDown,
  };

  return trimToLimit([...history, next], limit);
}

/**
 * Pure helper to mark all facts/keywords as revealed (useful when ending a game).
 */
export function revealPuzzleContent(content?: PuzzleContent): PuzzleContent | undefined {
  if (!content) return content;

  const facts = content.facts?.map((fact) => ({ ...fact, revealed: true }));
  const keywords = content.keywords?.map((keyword) => ({ ...keyword, revealed: true }));

  return {
    ...content,
    facts,
    keywords,
  };
}

/**
 * Add a chat message to a session container without mutating it.
 */
export function addChatMessageToSession(
  session: SessionStateContainer,
  message: SessionChatMessage,
  limit = DEFAULT_CHAT_HISTORY_LIMIT,
): SessionStateContainer {
  return {
    ...session,
    chatHistory: upsertChatHistory(session.chatHistory, message, limit),
  };
}

/**
 * Add a question entry to a session container without mutating it.
 */
export function addQuestionToSession(
  session: SessionStateContainer,
  question: string,
  answer: AnswerType,
  limit = DEFAULT_QUESTION_HISTORY_LIMIT,
  timestamp: Date = new Date(),
  thumbsDown = false,
): SessionStateContainer {
  return {
    ...session,
    questionHistory: appendQuestionHistory(session.questionHistory, question, answer, limit, timestamp, thumbsDown),
  };
}
