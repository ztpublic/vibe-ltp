'use client';

import React, { ReactNode, useRef } from 'react';
import type { ChatMessage } from '@vibe-ltp/shared';
import type { ChatService } from './services';
import { encodeBotMessage, encodeUserText, truncateText } from './utils/chatEncoding';
import { useChatIdentity } from './identity/useChatIdentity';

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
  const { nickname } = useChatIdentity();
  // Track the last user message ID and nickname for reply linking
  const lastUserMessageIdRef = useRef<string | null>(null);
  const lastUserMessageTextRef = useRef<string | null>(null);
  const lastUserMessageNicknameRef = useRef<string | null>(null);

  const appendBotMessage = (content: string, replyToId?: string, replyToPreview?: string, replyToNickname?: string) => {
    // Encode the bot message with metadata
    const encoded = encodeBotMessage({
      content,
      replyToId,
      replyToPreview,
      replyToNickname,
    });
    
    const botMessage = createChatBotMessage(encoded);
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  };

  const handleUserMessage = async (userMessage: string) => {
    // Encode nickname into message text
    const encodedText = encodeUserText(nickname, userMessage);
    // Note: encodedText is stored in state when react-chatbot-kit creates the message
    // We don't use it directly here, but it's needed for the message component to decode
    
    // Generate a deterministic ID for this user message (content-based, no timestamp)
    // This must match the ID generation in PuzzleUserMessage component
    const contentHash = userMessage.slice(0, 10).replace(/\s/g, '_');
    const userMessageId = `user_${contentHash}_${userMessage.length}`;
    const userMessagePreview = truncateText(userMessage, 40);
    
    // Store for use when bot replies
    lastUserMessageIdRef.current = userMessageId;
    lastUserMessageTextRef.current = userMessagePreview;
    lastUserMessageNicknameRef.current = nickname;

    // Build history from state
    let history: ChatMessage[] = [];

    setState((prev: any) => {
      history = prev.messages ?? [];
      return prev;
    });

    // Note: In the future, we can pass nickname to the backend in the request
    // For now, it's encoded in the message text for display purposes
    const reply = await chatService.sendMessage(userMessage, history);
    
    // Append bot message with reply metadata including nickname
    appendBotMessage(reply, userMessageId, userMessagePreview, nickname);
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
