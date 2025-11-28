'use client';

import React, { ReactNode, useRef } from 'react';
import type { ChatMessage } from '@vibe-ltp/shared';
import type { ChatService } from './services';
import { encodeBotMessage, truncateText } from './utils/chatEncoding';

type ActionProviderProps = {
  createChatBotMessage: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
  children: ReactNode;
  chatService: ChatService;
};

const ActionProvider: React.FC<ActionProviderProps> = ({
  createChatBotMessage,
  setState,
  children,
  chatService,
}) => {
  // Track the last user message ID for reply linking
  const lastUserMessageIdRef = useRef<string | null>(null);
  const lastUserMessageTextRef = useRef<string | null>(null);

  const appendBotMessage = (content: string, replyToId?: string, replyToPreview?: string) => {
    // Encode the bot message with metadata
    const encoded = encodeBotMessage({
      content,
      replyToId,
      replyToPreview,
    });
    
    const botMessage = createChatBotMessage(encoded);
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  };

  const handleUserMessage = async (userMessage: string) => {
    // Generate a deterministic ID for this user message (content-based, no timestamp)
    // This must match the ID generation in PuzzleUserMessage component
    const contentHash = userMessage.slice(0, 10).replace(/\s/g, '_');
    const userMessageId = `user_${contentHash}_${userMessage.length}`;
    const userMessagePreview = truncateText(userMessage, 40);
    
    // Store for use when bot replies
    lastUserMessageIdRef.current = userMessageId;
    lastUserMessageTextRef.current = userMessagePreview;

    // Build history from state
    let history: ChatMessage[] = [];

    setState((prev: any) => {
      history = prev.messages ?? [];
      return prev;
    });

    const reply = await chatService.sendMessage(userMessage, history);
    
    // Append bot message with reply metadata
    appendBotMessage(reply, userMessageId, userMessagePreview);
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
