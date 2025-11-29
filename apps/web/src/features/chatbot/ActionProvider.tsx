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

  const handleUserMessage = async (encodedMessage: string) => {
    // Message comes from MessageParser already encoded with nickname
    // Decode it to get the raw text and nickname
    const { nickname: msgNickname, text: userMessage } = (() => {
      const decoded = encodedMessage.startsWith('__NICK__')
        ? (() => {
            const without = encodedMessage.slice('__NICK__'.length);
            const idx = without.indexOf('::');
            if (idx === -1) return { nickname, text: encodedMessage };
            return { nickname: without.slice(0, idx), text: without.slice(idx + 2) };
          })()
        : { nickname, text: encodedMessage };
      return decoded;
    })();
    
    // CRITICAL: Replace the last user message in state with the encoded version
    // react-chatbot-kit automatically adds a message with raw text,
    // we need to replace it with our encoded version
    setState((prev: any) => {
      const messages = [...prev.messages];
      console.log('[ActionProvider] Current messages count:', messages.length);
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        console.log('[ActionProvider] Last message:', { 
          type: lastMessage.type, 
          message: lastMessage.message?.substring(0, 50),
          userMessage: userMessage.substring(0, 50)
        });
        // Check if the last message is a user message with the raw text
        if (lastMessage.type === 'user' && lastMessage.message === userMessage) {
          console.log('[ActionProvider] Replacing with encoded version');
          // Replace with encoded version
          messages[messages.length - 1] = {
            ...lastMessage,
            message: encodedMessage
          };
        } else {
          console.log('[ActionProvider] No match to replace, last message type:', lastMessage.type, 'message match:', lastMessage.message === userMessage);
        }
      }
      return { ...prev, messages };
    });
    
    // Generate a deterministic ID for this user message (content-based, no timestamp)
    // This must match the ID generation in PuzzleUserMessage component
    const contentHash = userMessage.slice(0, 10).replace(/\s/g, '_');
    const userMessageId = `user_${contentHash}_${userMessage.length}`;
    const userMessagePreview = truncateText(userMessage, 40);
    
    // Store for use when bot replies
    lastUserMessageIdRef.current = userMessageId;
    lastUserMessageTextRef.current = userMessagePreview;
    lastUserMessageNicknameRef.current = msgNickname;
    
    // Emit user message to server for persistence
    console.log('[ActionProvider] Emitting user message:', {
      id: userMessageId,
      content: userMessage,
      nickname: msgNickname,
      contentLength: userMessage.length
    });
    emitMessageToServer({
      id: userMessageId,
      type: 'user',
      content: userMessage,
      nickname: msgNickname,
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
    appendBotMessage(reply, userMessageId, userMessagePreview, msgNickname);
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
