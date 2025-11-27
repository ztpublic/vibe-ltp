import type { Session } from '../models/Session';

/**
 * Rules and validation for questions in a session
 */

/**
 * Check if a question text is valid
 */
export function isValidQuestionText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= 5 && trimmed.length <= 500;
}

/**
 * Check if a participant can ask a question in the session
 */
export function canAskQuestion(session: Session, socketId: string): boolean {
  const participant = session.participants.find((p) => p.socketId === socketId);
  if (!participant) {
    return false;
  }

  // Spectators cannot ask questions
  if (participant.role === 'SPECTATOR') {
    return false;
  }

  // Session must be in progress
  return session.status === 'IN_PROGRESS';
}

/**
 * Check if a participant can answer questions (must be host)
 */
export function canAnswerQuestion(session: Session, socketId: string): boolean {
  const participant = session.participants.find((p) => p.socketId === socketId);
  if (!participant) {
    return false;
  }

  // Only hosts can answer
  return participant.role === 'HOST' && session.status === 'IN_PROGRESS';
}
