'use client';

import React, { ReactNode } from 'react';
import type { BotMessage, ChatMessage, ChatReplyDecoration, ChatResponse, UserMessage } from '@vibe-ltp/shared';
import type { ChatService } from './services';
import { truncateText, createChatBotMessage } from '@vibe-ltp/ui/chatbot';
import type { ChatHistoryController } from './controllers';
import { v4 as uuidv4 } from 'uuid';
import type { ChatbotMessageStore, ChatbotUiMessage } from './messageStore';
import { createTimeoutController } from './utils/timeoutController';
import { buildReplyMetadata, type PendingUserContext } from './replyMetadata';
import { buildAnswerDecorator } from './utils/answerDecorators';

type CreateChatBotMessage = typeof createChatBotMessage;

type ActionProviderProps = {
  createChatBotMessage: CreateChatBotMessage;
  children?: ReactNode;
  chatService: ChatService;
  chatHistoryController?: ChatHistoryController;
  messageStore: ChatbotMessageStore;
};

const ActionProvider: React.FC<ActionProviderProps> = ({
  createChatBotMessage,
  children,
  chatService,
  chatHistoryController,
  messageStore,
}) => {
  const emitMessageToServer = (message: ChatMessage) => {
    if (chatHistoryController) {
      chatHistoryController.onMessageAdded(message);
    }
  };

  const appendBotMessage = (message: BotMessage) => {
    const replyMetadata =
      message.replyMetadata ?? buildReplyMetadata(null);

    // Prevent duplicate bot messages with same id (can happen when server broadcast races with local append)
    const existingId = message.id;
    if (existingId) {
      messageStore.mutateMessages((messages) => {
        const idx = messages.findIndex((msg) => String(msg.id) === String(existingId));
        if (idx === -1) return messages;

        const next = [...messages];
        const existing = next[idx];
        if (!existing) return messages;

        next[idx] = {
          ...existing,
          ...(message.content ? { message: message.content } : {}),
          loading: false,
          withAvatar: true,
        };
        return next;
      });

      emitMessageToServer({
        ...message,
        replyMetadata,
        timestamp: message.timestamp ?? new Date().toISOString(),
      });
      return;
    }

    const baseBotMessage = createChatBotMessage(message.content, {
      replyToId: replyMetadata?.replyToId,
      replyToPreview: replyMetadata?.replyToPreview,
      replyToNickname: replyMetadata?.replyToNickname,
    }) as unknown as ChatbotUiMessage;

    const botMessageNode: ChatbotUiMessage = {
      ...baseBotMessage,
      id: message.id ?? baseBotMessage.id ?? Date.now(),
      type: 'bot',
      loading: false, // Explicitly set loading to false since we already have the content
      withAvatar: true,
    };

    messageStore.appendMessage(botMessageNode);

    const messageWithTimestamp: BotMessage = {
      ...message,
      replyMetadata,
      timestamp: message.timestamp ?? new Date().toISOString(),
    };

    emitMessageToServer(messageWithTimestamp);
  };

  const decorateUserMessage = (
    decoration: ChatReplyDecoration,
    userChatMessage: UserMessage
  ) => {
    const decorator = buildAnswerDecorator(decoration.answer, decoration.tip);
    let found = false;

    messageStore.mutateMessages((messages) => {
      const next = messages.map((msg) => {
        if (msg.type !== 'user') return msg;

        const matches =
          String(msg.id) === String(decoration.targetMessageId) ||
          String(msg.serverMessageId ?? '') === String(decoration.targetMessageId);

        if (!matches) return msg;

        found = true;
        return { ...msg, decorators: [decorator], answer: decoration.answer, answerTip: decoration.tip };
      });

      if (!found) {
        for (let i = next.length - 1; i >= 0; i -= 1) {
          const candidate = next[i];
          if (candidate?.type === 'user') {
            next[i] = { ...candidate, decorators: [decorator], answer: decoration.answer, answerTip: decoration.tip };
            found = true;
            break;
          }
        }
      }

      return next;
    });

    const decoratedUserMessage: UserMessage = {
      ...userChatMessage,
      answer: decoration.answer,
      answerTip: decoration.tip,
      timestamp: userChatMessage.timestamp ?? new Date().toISOString(),
    };

    emitMessageToServer(decoratedUserMessage);
  };

  const sendUserMessage = async (
    userMessage: string,
    msgNickname: string,
    sendRequest: (
      userMessage: UserMessage,
      history?: ChatMessage[]
    ) => Promise<ChatResponse>
  ) => {
    const userMessageId = uuidv4();
    const userMessagePreview = truncateText(userMessage, 40);
    
    const pendingUserContext: PendingUserContext = {
      id: userMessageId,
      preview: userMessagePreview,
      nickname: msgNickname,
    };

    // Update the last user message in state with metadata + stable ID
    messageStore.mutateMessages((messages) => {
      if (messages.length === 0) return messages;
      const next = [...messages];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        const candidate = next[i];
        if (candidate?.type === 'user' && candidate.message === userMessage) {
          next[i] = {
            ...candidate,
            nickname: msgNickname,
            id: userMessageId,
            serverMessageId: userMessageId,
          };
          break;
        }
      }
      return next;
    });

    // Emit user message to server for persistence
    const userChatMessage: UserMessage = {
      id: userMessageId,
      type: 'user' as const,
      content: userMessage,
      nickname: msgNickname,
      timestamp: new Date().toISOString(),
    };
    emitMessageToServer(userChatMessage);

    const TIMEOUT_MS = 30000; // 30 seconds
    const { promise: timeoutPromise, cancel: cancelTimeout } = createTimeoutController<never>(
      TIMEOUT_MS,
      'Response timeout'
    );

    try {
      // Race between API call and timeout - send full user message object
      const historyForContext = chatHistoryController?.messages ?? [];

      const chatResponse = await Promise.race([
        sendRequest(userChatMessage, historyForContext),
        timeoutPromise,
      ]);

      if (chatResponse.decoration) {
        decorateUserMessage(chatResponse.decoration, userChatMessage);
      }

      if (chatResponse.reply) {
        appendBotMessage({
          ...chatResponse.reply,
          replyMetadata: chatResponse.reply.replyMetadata ?? buildReplyMetadata(pendingUserContext),
        });
      }
    } catch (error) {
      // Show error message - timeout or actual remote error
      let errorMsg: string;
      if (error instanceof Error && error.message === 'Response timeout') {
        errorMsg = '⏱️ 请求超时（30秒），请重试。';
      } else if (error instanceof Error) {
        // Show the actual error from remote server
        errorMsg = `❌ 错误: ${error.message}`;
      } else {
        errorMsg = '❌ 发生未知错误，请稍后重试。';
      }
      
      const errorMessage: BotMessage = {
        id: `bot-error-${Date.now()}`,
        type: 'bot',
        content: errorMsg,
        timestamp: new Date().toISOString(),
        replyMetadata: buildReplyMetadata(pendingUserContext),
      };
      appendBotMessage(errorMessage);
    } finally {
      cancelTimeout();
    }
  };

  const handleUserMessage = (userMessage: string, msgNickname: string) =>
    sendUserMessage(userMessage, msgNickname, chatService.sendMessage.bind(chatService));

  const handleSolutionRequest = (userMessage: string, msgNickname: string) =>
    sendUserMessage(userMessage, msgNickname, chatService.requestSolution.bind(chatService));

  const actions = {
    greet: () =>
      appendBotMessage({
        id: `bot-greet-${Date.now()}`,
        type: 'bot',
        content: '欢迎来到海龟汤游戏！',
        timestamp: new Date().toISOString(),
      }),
    handleUserMessage,
    handleSolutionRequest,
  };

  return (
    <>
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement, {
          actions,
        })
      )}
    </>
  );
};

export default ActionProvider;
