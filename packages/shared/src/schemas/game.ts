import { z } from 'zod';
import type {
  GameSessionId as SharedGameSessionId,
  GameState as SharedGameState,
  GameSession,
  GameSessionSnapshot,
  PuzzleContent,
  PuzzleFact,
  PuzzleKeyword,
  PuzzleSummary,
  SessionChatMessage,
  SessionQuestionHistoryEntry,
} from '../types/game.js';
import { AnswerTypeSchema, MessageIdSchema } from './messages.js';

export const GameSessionIdSchema = z.string().min(1);
export type GameSessionId = z.infer<typeof GameSessionIdSchema>;
type _EnsureGameSessionIdSync = GameSessionId extends SharedGameSessionId
  ? SharedGameSessionId extends GameSessionId
    ? true
    : never
  : never;

export const GameStateSchema = z.enum(['NotStarted', 'Started', 'Ended']);
export type GameState = z.infer<typeof GameStateSchema>;
type _EnsureGameStateSync = GameState extends SharedGameState ? (SharedGameState extends GameState ? true : never) : never;

export const PuzzleFactSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  revealed: z.boolean(),
});
type _EnsurePuzzleFactSync = z.infer<typeof PuzzleFactSchema> extends PuzzleFact
  ? PuzzleFact extends z.infer<typeof PuzzleFactSchema>
    ? true
    : never
  : never;

export const PuzzleKeywordSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  revealed: z.boolean(),
});
type _EnsurePuzzleKeywordSync = z.infer<typeof PuzzleKeywordSchema> extends PuzzleKeyword
  ? PuzzleKeyword extends z.infer<typeof PuzzleKeywordSchema>
    ? true
    : never
  : never;

export const PuzzleContentSchema = z.object({
  soupSurface: z.string().min(1),
  soupTruth: z.string().min(1),
  facts: z.array(PuzzleFactSchema).optional(),
  keywords: z.array(PuzzleKeywordSchema).optional(),
});
type _EnsurePuzzleContentSync = z.infer<typeof PuzzleContentSchema> extends PuzzleContent
  ? PuzzleContent extends z.infer<typeof PuzzleContentSchema>
    ? true
    : never
  : never;

export const PuzzleSummarySchema = z.object({
  soupSurface: z.string().min(1).optional(),
  facts: z.array(PuzzleFactSchema).optional(),
  keywords: z.array(PuzzleKeywordSchema).optional(),
});
type _EnsurePuzzleSummarySync = z.infer<typeof PuzzleSummarySchema> extends PuzzleSummary
  ? PuzzleSummary extends z.infer<typeof PuzzleSummarySchema>
    ? true
    : never
  : never;

export const GameSessionSchema = z.object({
  id: GameSessionIdSchema,
  title: z.string().min(1).optional(),
  state: GameStateSchema,
  hostNickname: z.string().min(1).optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  playerCount: z.number().int().min(0),
  puzzleSummary: PuzzleSummarySchema.optional(),
  isActive: z.boolean(),
});
type _EnsureGameSessionSync = z.infer<typeof GameSessionSchema> extends GameSession
  ? GameSession extends z.infer<typeof GameSessionSchema>
    ? true
    : never
  : never;

export const GameSessionSnapshotSchema = GameSessionSchema.extend({
  puzzleContent: PuzzleContentSchema.optional(),
});
type _EnsureGameSessionSnapshotSync = z.infer<typeof GameSessionSnapshotSchema> extends GameSessionSnapshot
  ? GameSessionSnapshot extends z.infer<typeof GameSessionSnapshotSchema>
    ? true
    : never
  : never;

export const SessionQuestionHistoryEntrySchema = z.object({
  messageId: MessageIdSchema.optional(),
  question: z.string().min(1),
  answer: AnswerTypeSchema,
  timestamp: z.string().min(1),
  thumbsDown: z.boolean().optional(),
});
type _EnsureSessionQuestionHistoryEntrySync = z.infer<typeof SessionQuestionHistoryEntrySchema> extends SessionQuestionHistoryEntry
  ? SessionQuestionHistoryEntry extends z.infer<typeof SessionQuestionHistoryEntrySchema>
    ? true
    : never
  : never;

export const SessionChatMessageSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['user', 'bot']),
  content: z.string().min(1),
  nickname: z.string().min(1).optional(),
  replyToId: MessageIdSchema.optional(),
  replyToPreview: z.string().min(1).optional(),
  replyToNickname: z.string().min(1).optional(),
  timestamp: z.string().min(1),
  answer: AnswerTypeSchema.optional(),
  answerTip: z.string().optional(),
});
type _EnsureSessionChatMessageSync = z.infer<typeof SessionChatMessageSchema> extends SessionChatMessage
  ? SessionChatMessage extends z.infer<typeof SessionChatMessageSchema>
    ? true
    : never
  : never;
