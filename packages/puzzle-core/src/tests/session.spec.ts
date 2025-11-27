import { describe, it, expect } from 'vitest';
import { Session } from '../models/Session';
import { Puzzle } from '../models/Puzzle';
import { PuzzleDifficulty, AnswerType, RoomStatus } from '@vibe-ltp/shared';

describe('Session', () => {
  const mockPuzzle = new Puzzle(
    'puzzle-1',
    'A man walks into a bar and dies.',
    'He walked into an iron bar.',
    ['classic', 'simple'],
    PuzzleDifficulty.EASY,
    new Date(),
    new Date()
  );

  it('should create a session in WAITING_FOR_PLAYERS state', () => {
    const session = new Session('session-1', mockPuzzle);
    expect(session.status).toBe(RoomStatus.WAITING_FOR_PLAYERS);
    expect(session.solutionRevealed).toBe(false);
  });

  it('should add participants', () => {
    const session = new Session('session-1', mockPuzzle);
    session.addParticipant('socket-1', 'HOST');
    session.addParticipant('socket-2', 'PLAYER');

    expect(session.participants).toHaveLength(2);
    expect(session.participants[0]?.role).toBe('HOST');
  });

  it('should not allow duplicate participants', () => {
    const session = new Session('session-1', mockPuzzle);
    session.addParticipant('socket-1', 'HOST');

    expect(() => {
      session.addParticipant('socket-1', 'PLAYER');
    }).toThrow('Participant already in session');
  });

  it('should start session when host is present', () => {
    const session = new Session('session-1', mockPuzzle);
    session.addParticipant('socket-1', 'HOST');
    session.start();

    expect(session.status).toBe(RoomStatus.IN_PROGRESS);
  });

  it('should not start session without host', () => {
    const session = new Session('session-1', mockPuzzle);
    session.addParticipant('socket-1', 'PLAYER');

    expect(() => {
      session.start();
    }).toThrow('Cannot start session without a host');
  });

  it('should allow asking questions during session', () => {
    const session = new Session('session-1', mockPuzzle);
    session.addParticipant('socket-1', 'HOST');
    session.addParticipant('socket-2', 'PLAYER');
    session.start();

    const question = session.askQuestion('socket-2', 'Was it an accident?');

    expect(question.text).toBe('Was it an accident?');
    expect(session.questions).toHaveLength(1);
  });

  it('should answer questions', () => {
    const session = new Session('session-1', mockPuzzle);
    session.addParticipant('socket-1', 'HOST');
    session.start();

    const question = session.askQuestion('socket-1', 'Was it intentional?');
    session.answerQuestion(question.id, AnswerType.NO, 'It was not intentional');

    const answered = session.questions.find((q) => q.id === question.id);
    expect(answered?.answer?.type).toBe(AnswerType.NO);
    expect(answered?.answer?.explanation).toBe('It was not intentional');
  });

  it('should reveal solution and mark as solved', () => {
    const session = new Session('session-1', mockPuzzle);
    session.addParticipant('socket-1', 'HOST');
    session.start();

    session.revealSolution();

    expect(session.solutionRevealed).toBe(true);
    expect(session.status).toBe(RoomStatus.SOLVED);
  });

  it('should abandon session', () => {
    const session = new Session('session-1', mockPuzzle);
    session.addParticipant('socket-1', 'HOST');
    session.start();

    session.abandon();

    expect(session.status).toBe(RoomStatus.ABANDONED);
  });
});
