'use client';

import type { BotMessage, MessageId } from '@vibe-ltp/shared';
import type { ChatbotUiMessage } from './messageStore';

export type PendingUserContext = {
  id: MessageId;
  preview: string;
  nickname: string;
};

export function buildReplyMetadata(context: PendingUserContext | null): BotMessage['replyMetadata'] {
  if (!context) return undefined;
  return {
    replyToId: context.id,
    replyToPreview: context.preview,
    replyToNickname: context.nickname,
  };
}

export function extractPendingUserContext(messages: ChatbotUiMessage[]): PendingUserContext | null {
  const lastUser = [...messages].reverse().find((msg) => msg.type === 'user');
  if (!lastUser || !lastUser.id) return null;

  return {
    id: String(lastUser.id),
    preview: typeof lastUser.message === 'string' ? lastUser.message.slice(0, 40) : '',
    nickname: typeof lastUser.nickname === 'string' ? lastUser.nickname : 'visitor',
  };
}
