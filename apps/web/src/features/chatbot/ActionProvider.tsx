'use client';

import React, { ReactNode } from 'react';
import type { BotMessage, ChatMessage, ChatReplyDecoration, ChatResponse, UserMessage, GameState } from '@vibe-ltp/shared';
import type { ChatService } from './services';
import { truncateText, createChatBotMessage } from '../../ui/chatbot';
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
  gameState?: GameState;
};

const ActionProvider: React.FC<ActionProviderProps> = ({
  createChatBotMessage,
  children,
  chatService,
  chatHistoryController,
  messageStore,
  gameState,
}) => {
  const appendBotMessage = (message: BotMessage) => {
    const replyMetadata =
      message.replyMetadata ?? buildReplyMetadata(null);

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
  };

  const decorateUserMessage = (
    decoration: ChatReplyDecoration
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
            // Show thumbs only when game has ended, and only thumbs down
            showThumbsUp: false,
            showThumbsDown: gameState === 'Ended',
          };
          break;
        }
      }
      return next;
    });

    const userChatMessage: UserMessage = {
      id: userMessageId,
      type: 'user' as const,
      content: userMessage,
      nickname: msgNickname,
      timestamp: new Date().toISOString(),
    };

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
        decorateUserMessage(chatResponse.decoration);
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
        const msg = error.message || '';
        if (msg.includes('410') || msg.toLowerCase().includes('ended')) {
          errorMsg = '🛑 房间已结束，请返回大厅或重新开始。';
        } else if (msg.includes('404')) {
          errorMsg = '❌ 房间不存在或已被清理，请返回大厅。';
        } else if (msg.includes('409')) {
          errorMsg = '⚠️ 本局尚未开始，请先点击“开始新汤”。';
        } else {
          errorMsg = `❌ 错误: ${msg}`;
        }
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

  type ActionProviderChildProps = {
    actions: typeof actions;
  };

  return (
    <>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<ActionProviderChildProps>(child)) return child;
        return React.cloneElement(child, { actions });
      })}
    </>
  );
};

export default ActionProvider;
