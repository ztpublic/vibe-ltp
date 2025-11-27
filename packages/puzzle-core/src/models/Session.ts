import type { RoomStatus, AnswerType } from '@vibe-ltp/shared';
import { RoomStatus as RoomStatusEnum } from '@vibe-ltp/shared';
import type { Puzzle } from './Puzzle';

/**
 * Domain model for a game session
 * Manages the state machine for a puzzle-solving session
 */

export interface SessionQuestion {
  id: string;
  socketId: string; // Socket connection ID of asker
  text: string;
  askedAt: Date;
  answer?: {
    type: AnswerType;
    explanation?: string;
    answeredAt: Date;
  };
}

export interface SessionParticipant {
  socketId: string; // Socket connection ID
  role: 'HOST' | 'PLAYER' | 'SPECTATOR';
  joinedAt: Date;
}

export class Session {
  private _status: RoomStatus;
  private _questions: SessionQuestion[] = [];
  private _participants: SessionParticipant[] = [];
  private _solutionRevealed: boolean = false;

  constructor(
    public readonly id: string,
    public readonly puzzle: Puzzle,
    public readonly createdAt: Date = new Date()
  ) {
    this._status = RoomStatusEnum.WAITING_FOR_PLAYERS;
  }

  get status(): RoomStatus {
    return this._status;
  }

  get questions(): ReadonlyArray<SessionQuestion> {
    return this._questions;
  }

  get participants(): ReadonlyArray<SessionParticipant> {
    return this._participants;
  }

  get solutionRevealed(): boolean {
    return this._solutionRevealed;
  }

  /**
   * Add a participant to the session
   */
  addParticipant(socketId: string, role: 'HOST' | 'PLAYER' | 'SPECTATOR'): void {
    const existing = this._participants.find((p) => p.socketId === socketId);
    if (existing) {
      throw new Error('Participant already in session');
    }

    this._participants.push({
      socketId,
      role,
      joinedAt: new Date(),
    });
  }

  /**
   * Start the session
   */
  start(): void {
    if (this._status !== RoomStatusEnum.WAITING_FOR_PLAYERS) {
      throw new Error('Session already started');
    }

    const hasHost = this._participants.some((p) => p.role === 'HOST');
    if (!hasHost) {
      throw new Error('Cannot start session without a host');
    }

    this._status = RoomStatusEnum.IN_PROGRESS;
  }

  /**
   * Ask a question in the session
   */
  askQuestion(socketId: string, questionText: string): SessionQuestion {
    if (this._status !== RoomStatusEnum.IN_PROGRESS) {
      throw new Error('Session not in progress');
    }

    const question: SessionQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      socketId,
      text: questionText,
      askedAt: new Date(),
    };

    this._questions.push(question);
    return question;
  }

  /**
   * Answer a question
   */
  answerQuestion(
    questionId: string,
    answerType: AnswerType,
    explanation?: string
  ): void {
    if (this._status !== RoomStatusEnum.IN_PROGRESS) {
      throw new Error('Session not in progress');
    }

    const question = this._questions.find((q) => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    if (question.answer) {
      throw new Error('Question already answered');
    }

    question.answer = {
      type: answerType,
      explanation,
      answeredAt: new Date(),
    };
  }

  /**
   * Reveal the solution
   */
  revealSolution(): void {
    if (this._status !== RoomStatusEnum.IN_PROGRESS) {
      throw new Error('Session not in progress');
    }

    this._solutionRevealed = true;
    this._status = RoomStatusEnum.SOLVED;
  }

  /**
   * Abandon the session
   */
  abandon(): void {
    if (this._status === RoomStatusEnum.SOLVED || this._status === RoomStatusEnum.ABANDONED) {
      throw new Error('Session already ended');
    }

    this._status = RoomStatusEnum.ABANDONED;
  }
}
