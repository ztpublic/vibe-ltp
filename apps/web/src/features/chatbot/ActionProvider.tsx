'use client';

import React, { ReactNode, useRef } from 'react';
import type { BotMessage, ChatMessage, MessageId } from '@vibe-ltp/shared';
import type { ChatService } from './services';
import { truncateText, createChatBotMessage } from '@vibe-ltp/react-chatbot-kit';
import type { ChatHistoryController } from './controllers';
import { v4 as uuidv4 } from 'uuid';
import type { ChatbotMessageStore, ChatbotUiMessage } from './messageStore';
import { createTimeoutController } from './utils/timeoutController';
import { buildReplyMetadata, type PendingUserContext } from './replyMetadata';

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
  // Track pending user -> bot reply mapping to avoid race conditions
  const pendingRepliesRef = useRef<
    Map<MessageId, { context: PendingUserContext; loadingMessageId: ChatbotUiMessage['id'] }>
  >(new Map());

  const emitMessageToServer = (message: ChatMessage) => {
    if (chatHistoryController) {
      chatHistoryController.onMessageAdded(message);
    }
  };

  const appendBotMessage = (message: BotMessage, options?: { replaceLoadingFor?: MessageId }) => {
    const pendingEntry = options?.replaceLoadingFor
      ? pendingRepliesRef.current.get(options.replaceLoadingFor)
      : null;
    const replyMetadata =
      message.replyMetadata ?? buildReplyMetadata(pendingEntry?.context ?? null);

    const botMessageNode: ChatbotUiMessage = {
      ...(createChatBotMessage(message.content, {
        replyToId: replyMetadata?.replyToId,
        replyToPreview: replyMetadata?.replyToPreview,
        replyToNickname: replyMetadata?.replyToNickname,
      }) as unknown as ChatbotUiMessage),
      type: 'bot',
      loading: false, // Explicitly set loading to false since we already have the content
      withAvatar: true,
    };

    // Preserve external IDs for consistency with persisted messages
    botMessageNode.id = message.id ?? botMessageNode.id;

    if (options?.replaceLoadingFor) {
      const targetUserMessageId = options.replaceLoadingFor;
      messageStore.mutateMessages((messages) => {
        const next = [...messages];
        const targetIndex = next.findIndex((msg) => {
          if (msg.type !== 'bot' || !msg.loading) return false;
          const matchesReply = msg.replyToId === targetUserMessageId;
          const matchesLoadingId =
            pendingEntry && msg.id === pendingEntry.loadingMessageId;
          return matchesReply || matchesLoadingId;
        });

        if (targetIndex !== -1) {
          next[targetIndex] = botMessageNode;
          return next;
        }

        // Fallback: clean any dangling loading for this user message, then append
        const filtered = next.filter(
          (msg) =>
            !(
              msg.type === 'bot' &&
              msg.loading &&
              msg.replyToId === targetUserMessageId
            )
        );
        filtered.push(botMessageNode);
        return filtered;
      });
      pendingRepliesRef.current.delete(targetUserMessageId);
    } else {
      messageStore.appendMessage(botMessageNode);
    }

    const messageWithTimestamp: BotMessage = {
      ...message,
      replyMetadata,
      timestamp: message.timestamp ?? new Date().toISOString(),
    };

    emitMessageToServer(messageWithTimestamp);
  };

  const handleUserMessage = async (userMessage: string, msgNickname: string) => {
    // Update the last user message in state with nickname metadata
    messageStore.mutateMessages((messages) => {
      if (messages.length === 0) return messages;
      const next = [...messages];
      const last = next[next.length - 1];
      if (last?.type === 'user' && last.message === userMessage) {
        next[next.length - 1] = {
          ...last,
          nickname: msgNickname,
        };
      }
      return next;
    });
    
    // Generate UUID for this user message
    const userMessageId = uuidv4();
    const userMessagePreview = truncateText(userMessage, 40);
    
    // Store for use when bot replies
    const pendingUserContext: PendingUserContext = {
      id: userMessageId,
      preview: userMessagePreview,
      nickname: msgNickname,
    };
    
    // Emit user message to server for persistence
    const userChatMessage: ChatMessage = {
      id: userMessageId,
      type: 'user' as const,
      content: userMessage,
      nickname: msgNickname,
      timestamp: new Date().toISOString(),
    };
    emitMessageToServer(userChatMessage);

    // Add loading indicator message with reply metadata
    const loadingMessage: ChatbotUiMessage = {
      ...(createChatBotMessage('', {
        loading: true,
        replyToId: userMessageId,
        replyToPreview: userMessagePreview,
        replyToNickname: msgNickname,
      }) as unknown as ChatbotUiMessage),
      type: 'bot',
      withAvatar: true,
    };
    messageStore.appendMessage(loadingMessage);
    pendingRepliesRef.current.set(userMessageId, {
      context: pendingUserContext,
      loadingMessageId: loadingMessage.id,
    });

    // Create a cancellable timeout
    const TIMEOUT_MS = 30000; // 30 seconds
    const { promise: timeoutPromise, cancel: cancelTimeout } = createTimeoutController<never>(
      TIMEOUT_MS,
      'Response timeout'
    );

    try {
      // Race between API call and timeout - send full user message object
      const historyForContext = chatHistoryController?.messages ?? [];

      const botReply = await Promise.race([
        chatService.sendMessage(userChatMessage, historyForContext),
        timeoutPromise,
      ]);

      // Remove loading message and add actual reply
      const botReplyWithMetadata: BotMessage = {
        ...botReply,
        replyMetadata: botReply.replyMetadata ?? buildReplyMetadata(pendingUserContext),
      };
      appendBotMessage(botReplyWithMetadata, { replaceLoadingFor: userMessageId });
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
      appendBotMessage(errorMessage, { replaceLoadingFor: userMessageId });
    } finally {
      cancelTimeout();
    }
  };

  const actions = {
    greet: () =>
      appendBotMessage({
        id: `bot-greet-${Date.now()}`,
        type: 'bot',
        content: '欢迎来到海龟汤游戏！',
        timestamp: new Date().toISOString(),
      }),
    handleUserMessage,
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
