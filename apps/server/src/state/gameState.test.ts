import { describe, it, expect, beforeEach } from 'vitest';
import {
  getGameState,
  setGameState,
  getPuzzleContent,
  setPuzzleContent,
  resetGameState,
  addChatMessage,
  getChatMessages,
  addQuestionToHistory,
  getQuestionHistory,
  getHistorySummary,
  type PersistedMessage
} from './gameState.js';

describe('Game State Management', () => {
  beforeEach(() => {
    resetGameState();
  });

  describe('State Transitions', () => {
    it('should start with NotStarted state', () => {
      expect(getGameState()).toBe('NotStarted');
    });

    it('should transition to Started with puzzle content', () => {
      setPuzzleContent({ soupSurface: 'Test', soupTruth: 'Answer' });
      setGameState('Started');
      expect(getGameState()).toBe('Started');
    });

    it('should throw when starting without puzzle', () => {
      expect(() => setGameState('Started')).toThrow('Cannot start game without puzzle content');
    });

    it('should throw when starting already started game', () => {
      setPuzzleContent({ soupSurface: 'Test', soupTruth: 'Answer' });
      setGameState('Started');
      expect(() => setGameState('Started')).toThrow('Game already started. Reset before starting new game.');
    });

    it('should reset state and clear history', () => {
      setPuzzleContent({ soupSurface: 'Test', soupTruth: 'Answer' });
      setGameState('Started');
      addChatMessage({
        id: '1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date().toISOString()
      });
      
      resetGameState();
      
      expect(getGameState()).toBe('NotStarted');
      expect(getPuzzleContent()).toBeUndefined();
      expect(getChatMessages()).toHaveLength(0);
    });
  });

  describe('Message History Management', () => {
    it('should add and retrieve messages', () => {
      const message: PersistedMessage = {
        id: '1',
        type: 'user',
        content: 'Test message',
        timestamp: new Date().toISOString()
      };
      
      addChatMessage(message);
      expect(getChatMessages()).toContainEqual(message);
    });

    it('should trim messages when exceeding limit', () => {
      // Add 201 messages (assuming MAX = 200)
      for (let i = 0; i < 201; i++) {
        addChatMessage({
          id: String(i),
          type: 'user',
          content: `Message ${i}`,
          timestamp: new Date().toISOString()
        });
      }
      
      const messages = getChatMessages();
      expect(messages.length).toBe(200);
      expect(messages[0]?.id).toBe('1'); // First message (id=0) trimmed
    });

    it('should handle messages with nicknames and reply metadata', () => {
      const message: PersistedMessage = {
        id: '1',
        type: 'user',
        content: 'Test message',
        nickname: 'TestUser',
        replyToId: 'msg0',
        replyToPreview: 'Previous message',
        replyToNickname: 'OtherUser',
        timestamp: new Date().toISOString()
      };
      
      addChatMessage(message);
      const retrieved = getChatMessages();
      expect(retrieved[0]).toEqual(message);
    });
  });

  describe('Question History', () => {
    it('should add questions to history', () => {
      addQuestionToHistory('Is it day?', 'yes', 'Good observation');
      const history = getQuestionHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0]?.question).toBe('Is it day?');
      expect(history[0]?.answer).toBe('yes');
      expect(history[0]?.tips).toBe('Good observation');
      expect(history[0]?.timestamp).toBeInstanceOf(Date);
    });

    it('should trim question history when exceeding limit', () => {
      // Add 101 questions (assuming MAX = 100)
      for (let i = 0; i < 101; i++) {
        addQuestionToHistory(`Question ${i}?`, 'yes');
      }
      
      const history = getQuestionHistory();
      expect(history.length).toBe(100);
      expect(history[0]?.question).toBe('Question 1?'); // First question (0) trimmed
    });

    it('should generate correct summary', () => {
      addQuestionToHistory('Is it day?', 'yes');
      addQuestionToHistory('Is it night?', 'no');
      addQuestionToHistory('What time?', 'irrelevant');
      
      const summary = getHistorySummary();
      expect(summary).toContain('✓ Is it day?');
      expect(summary).toContain('✗ Is it night?');
      expect(summary).not.toContain('What time?');
    });

    it('should return empty string for no history', () => {
      expect(getHistorySummary()).toBe('');
    });

    it('should include yes and no answers in summary', () => {
      addQuestionToHistory('Question 1?', 'yes');
      addQuestionToHistory('Question 2?', 'no');
      addQuestionToHistory('Question 3?', 'both');
      addQuestionToHistory('Question 4?', 'unknown');
      
      const summary = getHistorySummary();
      const lines = summary.split('\n');
      expect(lines.length).toBe(2); // Only yes/no questions
    });
  });

  describe('Puzzle Content', () => {
    it('should set and retrieve puzzle content', () => {
      const puzzle = { soupSurface: 'Surface', soupTruth: 'Truth' };
      setPuzzleContent(puzzle);
      expect(getPuzzleContent()).toEqual(puzzle);
    });

    it('should clear puzzle content on reset', () => {
      setPuzzleContent({ soupSurface: 'Test', soupTruth: 'Answer' });
      resetGameState();
      expect(getPuzzleContent()).toBeUndefined();
    });
  });
});
