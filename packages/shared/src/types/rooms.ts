/**
 * Shared types for rooms and game sessions
 */

export enum RoomStatus {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLVED = 'SOLVED',
  ABANDONED = 'ABANDONED',
}

export enum ParticipantRole {
  HOST = 'HOST',
  PLAYER = 'PLAYER',
  SPECTATOR = 'SPECTATOR',
}

export enum AnswerType {
  YES = 'YES',
  NO = 'NO',
  MAYBE = 'MAYBE',
  IRRELEVANT = 'IRRELEVANT',
}

export interface Room {
  id: string;
  puzzleId: string;
  status: RoomStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomParticipant {
  id: string;
  roomId: string;
  socketId: string; // Socket connection ID
  role: ParticipantRole;
  joinedAt: Date;
}

export interface Question {
  id: string;
  roomId: string;
  socketId: string; // Socket connection ID of asker
  text: string;
  askedAt: Date;
}

export interface Answer {
  id: string;
  questionId: string;
  type: AnswerType;
  explanation?: string;
  answeredAt: Date;
}

export interface RoomState {
  room: Room;
  participants: RoomParticipant[];
  questions: Question[];
  answers: Answer[];
  solutionRevealed: boolean;
}
