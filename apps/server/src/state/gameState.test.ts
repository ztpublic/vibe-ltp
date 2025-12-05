import { describe, it, expect, beforeEach } from 'vitest';
import type { SessionChatMessage } from '@vibe-ltp/shared';
import {
  SESSION_TTL_MS,
  addChatMessage,
  addQuestionToHistory,
  cleanupIdleSessions,
  clearAllState,
  createSession,
  endSession,
  getChatMessages,
  getConversationHistory,
  getDefaultSessionId,
  getGameState,
  getPuzzleContent,
  getQuestionHistory,
  getSession,
  listSessions,
  joinSession,
  resetGameState,
  setGameState,
  setPuzzleContent,
  startSession,
  updateSessionActivity,
} from './gameState.js';

describe('Session Store', () => {
  beforeEach(() => {
    clearAllState();
  });

  it('initializes with a default session', () => {
    const defaultId = getDefaultSessionId();
    const session = getSession(defaultId);

    expect(session?.state).toBe('NotStarted');
    expect(session?.isActive).toBe(true);
  });

  it('creates and lists independent sessions', () => {
    const created = createSession({ title: 'Lobby A', hostNickname: 'Host' });
    const listed = listSessions().find((item) => item.id === created.id);

    expect(created.title).toBe('Lobby A');
    expect(listed?.title).toBe('Lobby A');
    expect(listed?.hostNickname).toBe('Host');
  });

  it('requires puzzle content before starting a session', () => {
    const sessionId = createSession().id;

    expect(() => setGameState('Started', sessionId)).toThrow('Cannot start game without puzzle content.');

    const puzzle = { soupSurface: 'Surface', soupTruth: 'Truth' };
    setPuzzleContent(puzzle, sessionId);
    setGameState('Started', sessionId);

    expect(getGameState(sessionId)).toBe('Started');
    expect(getPuzzleContent(sessionId)).toEqual(puzzle);
  });

  it('starts a session via startSession', () => {
    const sessionId = createSession().id;
    const puzzle = { soupSurface: 'Start via helper', soupTruth: 'Truth' };

    const snapshot = startSession(sessionId, puzzle);
    expect(snapshot.state).toBe('Started');
    expect(snapshot.puzzleContent).toEqual(puzzle);
  });

  it('resets a session while preserving chat and keeping questions for export', () => {
    const sessionId = createSession().id;
    setPuzzleContent({ soupSurface: 'Surface', soupTruth: 'Truth' }, sessionId);
    setGameState('Started', sessionId);

    const message: SessionChatMessage = {
      id: '1',
      type: 'user',
      content: 'Hello',
      nickname: 'Tester',
      timestamp: new Date().toISOString(),
    };
    addChatMessage(message, sessionId);
    addQuestionToHistory('Is it day?', 'yes', sessionId);

    resetGameState(sessionId);

    expect(getGameState(sessionId)).toBe('NotStarted');
    expect(getPuzzleContent(sessionId)?.soupTruth).toBe('Truth');
    expect(getQuestionHistory(sessionId)).toHaveLength(1);
    expect(getChatMessages(sessionId)).toHaveLength(1);
  });

  it('ends a session and reveals puzzle content while keeping chat by default', () => {
    const sessionId = createSession().id;
    const puzzle = {
      soupSurface: 'Surface',
      soupTruth: 'Truth',
      facts: [{ id: 'f1', text: 'Fact', revealed: false }],
    };
    startSession(sessionId, puzzle);

    const message: SessionChatMessage = {
      id: 'end-1',
      type: 'bot',
      content: 'Final',
      timestamp: new Date().toISOString(),
    };
    addChatMessage(message, sessionId);

    const snapshot = endSession(sessionId);
    expect(snapshot.state).toBe('Ended');
    expect(snapshot.puzzleContent?.facts?.[0]?.revealed).toBe(true);
    expect(getChatMessages(sessionId)).toHaveLength(1);
  });

  it('trims chat and question histories per session', () => {
    const sessionId = createSession().id;
    for (let i = 0; i < 201; i += 1) {
      addChatMessage(
        {
          id: `m-${i}`,
          type: 'user',
          content: `Message ${i}`,
          timestamp: new Date().toISOString(),
        },
        sessionId,
      );
      addQuestionToHistory(`Q${i}?`, 'yes', sessionId);
    }

    const chats = getChatMessages(sessionId);
    expect(chats.length).toBe(200);
    expect(chats[0]?.id).toBe('m-1');

    const questions = getQuestionHistory(sessionId);
    expect(questions.length).toBe(100);
    expect(questions[0]?.question).toBe('Q101?');
    expect(typeof questions[0]?.timestamp).toBe('string');
  });

  it('isolates state between sessions', () => {
    const sessionA = createSession().id;
    const sessionB = createSession().id;

    setPuzzleContent({ soupSurface: 'A', soupTruth: 'Truth A' }, sessionA);
    setGameState('Started', sessionA);

    expect(getGameState(sessionB)).toBe('NotStarted');
    expect(getPuzzleContent(sessionB)).toBeUndefined();
  });

  it('increments player count on joinSession', () => {
    const sessionId = createSession().id;
    const before = getSession(sessionId);
    expect(before?.playerCount).toBe(0);

    const afterJoin = joinSession(sessionId);
    expect(afterJoin.playerCount).toBe(1);
  });

  it('cleans up idle sessions past TTL but keeps default session', () => {
    const sessionId = createSession().id;
    const staleTime = Date.now() - SESSION_TTL_MS - 1000;

    updateSessionActivity(sessionId, staleTime);
    const removed = cleanupIdleSessions(Date.now());

    expect(removed).toContain(sessionId);
    expect(getSession(sessionId)).toBeUndefined();

    // Default session remains intact
    expect(getSession(getDefaultSessionId())).toBeDefined();
  });

  it('provides conversation history in question/answer pairs', () => {
    const sessionId = createSession().id;
    addQuestionToHistory('Is it day?', 'yes', sessionId);
    addQuestionToHistory('Is it night?', 'no', sessionId);

    const convo = getConversationHistory(sessionId);
    expect(convo).toEqual([
      { question: 'Is it day?', answer: 'yes' },
      { question: 'Is it night?', answer: 'no' },
    ]);
  });
});
