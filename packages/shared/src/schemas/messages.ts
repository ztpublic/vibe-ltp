import { z } from 'zod';
import type {
  AnswerType as SharedAnswerType,
  BotMessage,
  BotReplyMetadata,
  ChatMessage,
  MessageId as SharedMessageId,
  MessageType as SharedMessageType,
  SystemMessage,
  UserMessage,
} from '../types/messages.js';

export const MessageIdSchema = z.string().min(1);
export type MessageId = z.infer<typeof MessageIdSchema>;
type _EnsureMessageIdSync = MessageId extends SharedMessageId ? (SharedMessageId extends MessageId ? true : never) : never;

export const MessageTypeSchema = z.enum(['user', 'bot', 'system']);
export type MessageType = z.infer<typeof MessageTypeSchema>;
type _EnsureMessageTypeSync = MessageType extends SharedMessageType
  ? SharedMessageType extends MessageType
    ? true
    : never
  : never;

export const AnswerTypeSchema = z.enum(['yes', 'no', 'irrelevant', 'both', 'unknown']);
export type AnswerType = z.infer<typeof AnswerTypeSchema>;
type _EnsureAnswerTypeSync = AnswerType extends SharedAnswerType
  ? SharedAnswerType extends AnswerType
    ? true
    : never
  : never;

export const BaseMessageSchema = z.object({
  id: MessageIdSchema,
  type: MessageTypeSchema,
  content: z.string().min(1),
  timestamp: z.string().min(1),
  showThumbsUp: z.boolean().optional(),
  showThumbsDown: z.boolean().optional(),
  thumbsUp: z.boolean().optional(),
  thumbsDown: z.boolean().optional(),
});

export const BotReplyMetadataSchema = z.object({
  replyToId: MessageIdSchema,
  replyToPreview: z.string().min(1),
  replyToNickname: z.string().min(1),
});
type _EnsureBotReplyMetadataSync = z.infer<typeof BotReplyMetadataSchema> extends BotReplyMetadata
  ? BotReplyMetadata extends z.infer<typeof BotReplyMetadataSchema>
    ? true
    : never
  : never;

export const UserMessageSchema = BaseMessageSchema.extend({
  type: z.literal('user'),
  nickname: z.string().min(1),
  answer: AnswerTypeSchema.optional(),
  answerTip: z.string().optional(),
});
type _EnsureUserMessageSync = z.infer<typeof UserMessageSchema> extends UserMessage
  ? UserMessage extends z.infer<typeof UserMessageSchema>
    ? true
    : never
  : never;

export const BotMessageSchema = BaseMessageSchema.extend({
  type: z.literal('bot'),
  replyMetadata: BotReplyMetadataSchema.optional(),
});
type _EnsureBotMessageSync = z.infer<typeof BotMessageSchema> extends BotMessage
  ? BotMessage extends z.infer<typeof BotMessageSchema>
    ? true
    : never
  : never;

export const SystemMessageSchema = BaseMessageSchema.extend({
  type: z.literal('system'),
});
type _EnsureSystemMessageSync = z.infer<typeof SystemMessageSchema> extends SystemMessage
  ? SystemMessage extends z.infer<typeof SystemMessageSchema>
    ? true
    : never
  : never;

export const ChatMessageSchema = z.discriminatedUnion('type', [UserMessageSchema, BotMessageSchema, SystemMessageSchema]);
type _EnsureChatMessageSync = z.infer<typeof ChatMessageSchema> extends ChatMessage
  ? ChatMessage extends z.infer<typeof ChatMessageSchema>
    ? true
    : never
  : never;

