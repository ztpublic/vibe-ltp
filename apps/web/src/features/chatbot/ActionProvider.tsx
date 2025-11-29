'use client';

import React, { ReactNode, useRef } from 'react';
import type { ChatMessage } from '@vibe-ltp/shared';
import { SOCKET_EVENTS } from '@vibe-ltp/shared';
import type { ChatService } from './services';
import { encodeBotMessage, encodeUserText, truncateText } from './utils/chatEncoding';
import { useChatIdentity } from './identity/useChatIdentity';
import { acquireSocket, releaseSocket } from '../../lib/socketManager';
import { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type ActionProviderProps = {
  createChatBotMessage: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
  children: ReactNode;
  chatService: ChatService;
  socket?: Socket | null;
};

const ActionProvider: React.FC<ActionProviderProps> = ({
  createChatBotMessage,
  setState,
  children,
  chatService,
  socket,
}) => {
  const { nickname } = useChatIdentity();
  // Track the last user message ID and nickname for reply linking
  const lastUserMessageIdRef = useRef<string | null>(null);
  const lastUserMessageTextRef = useRef<string | null>(null);
  const lastUserMessageNicknameRef = useRef<string | null>(null);

  const emitMessageToServer = (message: {
    id: string;
    type: 'user' | 'bot';
    content: string;
    nickname?: string;
    replyToId?: string;
    replyToPreview?: string;
    replyToNickname?: string;
  }) => {
    if (socket?.connected) {
      console.log('[ActionProvider] Emitting message to server:', message.type, message.id);
      socket.emit(SOCKET_EVENTS.CHAT_MESSAGE_ADDED, {
        message: {
          ...message,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      console.warn('[ActionProvider] Socket not connected, cannot emit message');
    }
  };

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
    
    // Emit bot message to server for persistence
    const botMessageId = `bot_${Date.now()}_${content.slice(0, 10).replace(/\s/g, '_')}`;
    emitMessageToServer({
      id: botMessageId,
      type: 'bot',
      content,
      replyToId,
      replyToPreview,
      replyToNickname,
    });
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
    
    // Emit user message to server for persistence
    console.log('[ActionProvider] Emitting user message:', {
      id: userMessageId,
      content: userMessage,
      nickname,
      contentLength: userMessage.length
    });
    emitMessageToServer({
      id: userMessageId,
      type: 'user',
      content: userMessage,
      nickname,
    });

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
