'use client';

import React, { ReactNode, useRef } from 'react';
import type { ChatMessage } from '@vibe-ltp/shared';
import type { ChatService } from './services';
import { truncateText } from '@vibe-ltp/react-chatbot-kit';
import { useChatIdentity } from './identity/useChatIdentity';
import type { ChatHistoryController } from './controllers';
import { v4 as uuidv4 } from 'uuid';

type ActionProviderProps = {
  createChatBotMessage: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
  children: ReactNode;
  chatService: ChatService;
  chatHistoryController?: ChatHistoryController;
};

const ActionProvider: React.FC<ActionProviderProps> = ({
  createChatBotMessage,
  setState,
  children,
  chatService,
  chatHistoryController,
}) => {
  const { nickname } = useChatIdentity();
  // Track the last user message ID and nickname for reply linking
  const lastUserMessageIdRef = useRef<string | null>(null);
  const lastUserMessageTextRef = useRef<string | null>(null);
  const lastUserMessageNicknameRef = useRef<string | null>(null);

  const emitMessageToServer = (message: ChatMessage) => {
    if (chatHistoryController) {
      chatHistoryController.onMessageAdded(message);
    }
  };

  const appendBotMessage = (content: string, replyToId?: string, replyToPreview?: string, replyToNickname?: string) => {
    // Create bot message with structured reply metadata (no encoding)
    const botMessage = createChatBotMessage(content, {
      replyToId,
      replyToPreview,
      replyToNickname,
    });
    
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
    
    // Emit bot message to server for persistence
    const botMessageId = uuidv4();
    const botChatMessage: ChatMessage = {
      id: botMessageId,
      type: 'bot' as const,
      content,
      timestamp: new Date().toISOString(),
      replyMetadata: replyToId ? {
        replyToId,
        replyToPreview: replyToPreview!,
        replyToNickname: replyToNickname!,
      } : undefined,
    };
    emitMessageToServer(botChatMessage);
  };

  const handleUserMessage = async (userMessage: string, msgNickname: string) => {
    // Receive plain text and nickname separately (no decoding needed)
    
    // Update the last user message in state with nickname metadata
    setState((prev: any) => {
      const messages = [...prev.messages];
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        // Add nickname to the user message
        if (lastMessage.type === 'user' && lastMessage.message === userMessage) {
          messages[messages.length - 1] = {
            ...lastMessage,
            nickname: msgNickname,
          };
        }
      }
      return { ...prev, messages };
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
    const loadingMessage = createChatBotMessage('', {
      loading: true,
      replyToId: userMessageId,
      replyToPreview: userMessagePreview,
      replyToNickname: msgNickname,
    });
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, loadingMessage],
    }));

    // Create a timeout promise
    const TIMEOUT_MS = 30000; // 30 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Response timeout')), TIMEOUT_MS);
    });

    try {
      // Race between API call and timeout - send full user message object
      const botReply = await Promise.race([
        chatService.sendMessage(userChatMessage),
        timeoutPromise,
      ]);

      // Remove loading message and add actual reply
      setState((prev: any) => ({
        ...prev,
        messages: prev.messages.slice(0, -1),
      }));
      
      // Append bot message with reply metadata including nickname
      appendBotMessage(botReply.content, userMessageId, userMessagePreview, msgNickname);
    } catch (error) {
      // Remove loading message
      setState((prev: any) => ({
        ...prev,
        messages: prev.messages.slice(0, -1),
      }));

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
      
      appendBotMessage(errorMsg, userMessageId, userMessagePreview, msgNickname);
    }
  };

  const actions = {
    greet: () => appendBotMessage('欢迎来到海龟汤游戏！'),
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
