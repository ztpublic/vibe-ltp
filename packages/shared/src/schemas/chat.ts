import { z } from 'zod';
import type {
  ChatFeedbackRequest,
  ChatFeedbackResponse,
  ChatReplyDecoration,
  ChatRequest,
  ChatResponse,
} from '../api/chat.js';
import { ChatMessageSchema, MessageIdSchema, UserMessageSchema, BotMessageSchema, AnswerTypeSchema } from './messages.js';
import { GameSessionIdSchema } from './game.js';

export const ChatRequestSchema = z.object({
  message: UserMessageSchema,
  history: z.array(ChatMessageSchema).optional(),
  sessionId: GameSessionIdSchema.optional(),
});
type _EnsureChatRequestSync = z.infer<typeof ChatRequestSchema> extends ChatRequest
  ? ChatRequest extends z.infer<typeof ChatRequestSchema>
    ? true
    : never
  : never;

export const ChatReplyDecorationSchema = z.object({
  targetMessageId: MessageIdSchema,
  answer: AnswerTypeSchema,
  tip: z.string().optional(),
});
type _EnsureChatReplyDecorationSync = z.infer<typeof ChatReplyDecorationSchema> extends ChatReplyDecoration
  ? ChatReplyDecoration extends z.infer<typeof ChatReplyDecorationSchema>
    ? true
    : never
  : never;

export const ChatResponseSchema = z.object({
  reply: BotMessageSchema.optional(),
  decoration: ChatReplyDecorationSchema.optional(),
  newState: z.record(z.unknown()).optional(),
});
type _EnsureChatResponseSync = z.infer<typeof ChatResponseSchema> extends ChatResponse
  ? ChatResponse extends z.infer<typeof ChatResponseSchema>
    ? true
    : never
  : never;

export const ChatFeedbackRequestSchema = z.object({
  sessionId: GameSessionIdSchema.optional(),
  messageId: MessageIdSchema,
  direction: z.enum(['up', 'down']).nullable().optional(),
  question: z.string().min(1).optional(),
});
type _EnsureChatFeedbackRequestSync = z.infer<typeof ChatFeedbackRequestSchema> extends ChatFeedbackRequest
  ? ChatFeedbackRequest extends z.infer<typeof ChatFeedbackRequestSchema>
    ? true
    : never
  : never;

export const ChatFeedbackResponseSchema = z.object({
  success: z.boolean(),
});
type _EnsureChatFeedbackResponseSync = z.infer<typeof ChatFeedbackResponseSchema> extends ChatFeedbackResponse
  ? ChatFeedbackResponse extends z.infer<typeof ChatFeedbackResponseSchema>
    ? true
    : never
  : never;

