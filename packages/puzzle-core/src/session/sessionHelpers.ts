import { Session } from '../models/Session';
import type { Puzzle } from '../models/Puzzle';

/**
 * Helper functions for session management
 */

/**
 * Create a new session for a puzzle
 */
export function createSession(puzzle: Puzzle): Session {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return new Session(sessionId, puzzle);
}

/**
 * Check if a session can be started
 */
export function canStartSession(session: Session): boolean {
  return (
    session.status === 'WAITING_FOR_PLAYERS' &&
    session.participants.some((p) => p.role === 'HOST')
  );
}

/**
 * Get unanswered questions in a session
 */
export function getUnansweredQuestions(session: Session) {
  return session.questions.filter((q) => !q.answer);
}

/**
 * Get answered questions in a session
 */
export function getAnsweredQuestions(session: Session) {
  return session.questions.filter((q) => q.answer);
}
