'use client';

import type React from 'react';
import type { AnswerType } from '@vibe-ltp/shared';

export type ChatbotUiMessage = {
  id: string | number;
  type: 'user' | 'bot';
  message?: string;
  nickname?: string;
  loading?: boolean;
  widget?: string;
  delay?: number;
  replyToId?: string;
  replyToPreview?: string;
  replyToNickname?: string;
  /** Optional stable ID used for server-side tracking */
  serverMessageId?: string;
  answer?: AnswerType;
  answerTip?: string;
  [key: string]: unknown;
};

export type ChatbotState = {
  messages: ChatbotUiMessage[];
};

export type ChatbotMessageStore = {
  getMessages: () => ChatbotUiMessage[];
  appendMessage: (message: ChatbotUiMessage) => void;
  removeLastMessage: (predicate?: (message: ChatbotUiMessage) => boolean) => void;
  replaceMessages: (messages: ChatbotUiMessage[], options?: { preserveTrailingLoading?: boolean }) => void;
  mutateMessages: (updater: (messages: ChatbotUiMessage[]) => ChatbotUiMessage[]) => void;
  getPendingLoadingMessages: () => ChatbotUiMessage[];
  getLatestUserMessage: () => ChatbotUiMessage | null;
};

type StoreDeps = {
  getState: () => ChatbotState | null | undefined;
  setState: React.Dispatch<React.SetStateAction<ChatbotState>>;
};

const findLastIndex = <T,>(arr: T[], predicate: (value: T) => boolean): number => {
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    if (predicate(arr[i]!)) return i;
  }
  return -1;
};

export function createChatbotMessageStore({ getState, setState }: StoreDeps): ChatbotMessageStore {
  const getMessages = () => getState()?.messages ?? [];

  const appendMessage = (message: ChatbotUiMessage) => {
    setState((prev) => ({
      ...(prev ?? { messages: [] }),
      messages: [...(prev?.messages ?? []), message],
    }));
  };

  const mutateMessages = (updater: (messages: ChatbotUiMessage[]) => ChatbotUiMessage[]) => {
    setState((prev) => {
      const current = prev?.messages ?? [];
      return {
        ...(prev ?? { messages: [] }),
        messages: updater(current),
      };
    });
  };

  const removeLastMessage = (predicate?: (message: ChatbotUiMessage) => boolean) => {
    mutateMessages((messages) => {
      if (messages.length === 0) return messages;
      if (!predicate) return messages.slice(0, -1);

      const targetIndex = findLastIndex(messages, predicate);
      if (targetIndex === -1) return messages;

      const next = [...messages];
      next.splice(targetIndex, 1);
      return next;
    });
  };

  const getPendingLoadingMessages = () => {
    const messages = getMessages();
    return messages.filter(
      (msg) => msg.loading && (!msg.message || String(msg.message).trim().length === 0)
    );
  };

  const getLatestUserMessage = () => {
    const messages = getMessages();
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg?.type === 'user') return msg;
    }
    return null;
  };

  const replaceMessages = (
    messages: ChatbotUiMessage[],
    options?: { preserveTrailingLoading?: boolean }
  ) => {
    const preservedLoadings =
      options?.preserveTrailingLoading === true ? getPendingLoadingMessages() : [];

    const filteredLoadings = preservedLoadings.filter((loading) => {
      // If the incoming messages already contain a reply to this user message, drop the placeholder
      const replyToId = loading.replyToId;
      if (!replyToId) return true;

      return !messages.some(
        (msg) =>
          msg.type === 'bot' &&
          (msg.replyToId === replyToId || String(msg.id) === String(replyToId))
      );
    });

    mutateMessages(() => {
      if (filteredLoadings.length === 0) return messages;

      const next = [...messages];

      filteredLoadings.forEach((loading) => {
        const replyToId = loading.replyToId;
        if (replyToId) {
          const userIndex = next.findIndex(
            (msg) => String(msg.id) === String(replyToId) && msg.type === 'user'
          );

          if (userIndex !== -1) {
            next.splice(userIndex + 1, 0, loading);
            return;
          }
        }

        next.push(loading);
      });

      return next;
    });
  };

  return {
    getMessages,
    appendMessage,
    removeLastMessage,
    replaceMessages,
    mutateMessages,
    getPendingLoadingMessages,
    getLatestUserMessage,
  };
}
