'use client';

import React, { ReactNode, useRef } from 'react';
import type { BotMessage, ChatMessage } from '@vibe-ltp/shared';
import type { ChatService } from './services';
import { truncateText } from '@vibe-ltp/react-chatbot-kit';
import type { ChatHistoryController } from './controllers';
import { v4 as uuidv4 } from 'uuid';
import type { ChatbotMessageStore, ChatbotUiMessage } from './messageStore';
import { createTimeoutController } from './utils/timeoutController';

type ActionProviderProps = {
  createChatBotMessage: any;
  children: ReactNode;
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
  // Track the last user message ID and nickname for reply linking
  const lastUserMessageIdRef = useRef<string | null>(null);
  const lastUserMessageTextRef = useRef<string | null>(null);
  const lastUserMessageNicknameRef = useRef<string | null>(null);

  const emitMessageToServer = (message: ChatMessage) => {
    if (chatHistoryController) {
      chatHistoryController.onMessageAdded(message);
    }
  };

  const appendBotMessage = (message: BotMessage) => {
    const botMessageNode: ChatbotUiMessage = createChatBotMessage(message.content, {
      replyToId: message.replyMetadata?.replyToId,
      replyToPreview: message.replyMetadata?.replyToPreview,
      replyToNickname: message.replyMetadata?.replyToNickname,
    });

    messageStore.appendMessage(botMessageNode);

    const messageWithTimestamp: BotMessage = {
      ...message,
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
    lastUserMessageIdRef.current = userMessageId;
    lastUserMessageTextRef.current = userMessagePreview;
    lastUserMessageNicknameRef.current = msgNickname;
    
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
    const loadingMessage: ChatbotUiMessage = createChatBotMessage('', {
      loading: true,
      replyToId: userMessageId,
      replyToPreview: userMessagePreview,
      replyToNickname: msgNickname,
    });
    messageStore.appendMessage(loadingMessage);

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
      messageStore.removeLastMessage((msg) => Boolean(msg.loading));
      
      // Append bot message with reply metadata including nickname
      const botReplyWithMetadata: BotMessage = {
        ...botReply,
        replyMetadata: botReply.replyMetadata ?? (lastUserMessageIdRef.current && lastUserMessageTextRef.current && lastUserMessageNicknameRef.current
          ? {
              replyToId: lastUserMessageIdRef.current,
              replyToPreview: lastUserMessageTextRef.current,
              replyToNickname: lastUserMessageNicknameRef.current,
            }
          : undefined),
      };
      appendBotMessage(botReplyWithMetadata);
    } catch (error) {
      // Remove loading message
      messageStore.removeLastMessage((msg) => Boolean(msg.loading));

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
        replyMetadata: lastUserMessageIdRef.current && lastUserMessageTextRef.current && lastUserMessageNicknameRef.current
          ? {
              replyToId: lastUserMessageIdRef.current,
              replyToPreview: lastUserMessageTextRef.current,
              replyToNickname: lastUserMessageNicknameRef.current,
            }
          : undefined,
      };
      appendBotMessage(errorMessage);
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
