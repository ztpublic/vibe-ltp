import { z } from 'zod';
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  EndSessionRequest,
  GetSessionResponse,
  GetSessionTruthResponse,
  JoinSessionRequest,
  ListSessionsResponse,
  StartSessionRequest,
} from '../api/sessions.js';
import {
  GameSessionIdSchema,
  GameSessionSchema,
  GameSessionSnapshotSchema,
  PuzzleContentSchema,
  SessionChatMessageSchema,
  SessionQuestionHistoryEntrySchema,
} from './game.js';

export const CreateSessionRequestSchema = z.object({
  title: z.string().min(1).optional(),
  hostNickname: z.string().min(1).optional(),
  puzzleContent: PuzzleContentSchema.optional(),
});
type _EnsureCreateSessionRequestSync = z.infer<typeof CreateSessionRequestSchema> extends CreateSessionRequest
  ? CreateSessionRequest extends z.infer<typeof CreateSessionRequestSchema>
    ? true
    : never
  : never;

export const CreateSessionResponseSchema = z.object({
  session: GameSessionSchema,
});
type _EnsureCreateSessionResponseSync = z.infer<typeof CreateSessionResponseSchema> extends CreateSessionResponse
  ? CreateSessionResponse extends z.infer<typeof CreateSessionResponseSchema>
    ? true
    : never
  : never;

export const ListSessionsResponseSchema = z.object({
  sessions: z.array(GameSessionSchema),
});
type _EnsureListSessionsResponseSync = z.infer<typeof ListSessionsResponseSchema> extends ListSessionsResponse
  ? ListSessionsResponse extends z.infer<typeof ListSessionsResponseSchema>
    ? true
    : never
  : never;

export const GetSessionResponseSchema = z.object({
  session: GameSessionSnapshotSchema,
  chatHistory: z.array(SessionChatMessageSchema).optional(),
  questionHistory: z.array(SessionQuestionHistoryEntrySchema).optional(),
});
type _EnsureGetSessionResponseSync = z.infer<typeof GetSessionResponseSchema> extends GetSessionResponse
  ? GetSessionResponse extends z.infer<typeof GetSessionResponseSchema>
    ? true
    : never
  : never;

export const GetSessionTruthResponseSchema = z.object({
  sessionId: GameSessionIdSchema,
  soupTruth: z.string().min(1),
});
type _EnsureGetSessionTruthResponseSync = z.infer<typeof GetSessionTruthResponseSchema> extends GetSessionTruthResponse
  ? GetSessionTruthResponse extends z.infer<typeof GetSessionTruthResponseSchema>
    ? true
    : never
  : never;

export const JoinSessionRequestSchema = z.object({
  nickname: z.string().min(1).optional(),
});
type _EnsureJoinSessionRequestSync = z.infer<typeof JoinSessionRequestSchema> extends JoinSessionRequest
  ? JoinSessionRequest extends z.infer<typeof JoinSessionRequestSchema>
    ? true
    : never
  : never;

export const StartSessionRequestSchema = z.object({
  puzzleContent: PuzzleContentSchema,
});
type _EnsureStartSessionRequestSync = z.infer<typeof StartSessionRequestSchema> extends StartSessionRequest
  ? StartSessionRequest extends z.infer<typeof StartSessionRequestSchema>
    ? true
    : never
  : never;

export const EndSessionRequestSchema = z.object({
  revealContent: z.boolean().optional(),
  preserveChat: z.boolean().optional(),
});
type _EnsureEndSessionRequestSync = z.infer<typeof EndSessionRequestSchema> extends EndSessionRequest
  ? EndSessionRequest extends z.infer<typeof EndSessionRequestSchema>
    ? true
    : never
  : never;
