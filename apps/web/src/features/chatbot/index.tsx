'use client';

import React, { useImperativeHandle, useRef, useState, useEffect } from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import './chatbot.css';
import config from './config';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';
import type { ChatService } from './services';
import { encodeBotMessage, encodeUserText } from './utils/chatEncoding';
import { acquireSocket, releaseSocket } from '../../lib/socketManager';
import { SOCKET_EVENTS } from '@vibe-ltp/shared';
import { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export type SoupBotChatProps = {
  chatService: ChatService;
  disabled?: boolean;
};

export interface SoupBotChatRef {
  addBotMessage: (content: string) => void;
}

export const SoupBotChat = React.forwardRef<SoupBotChatRef, SoupBotChatProps>((
  { chatService, disabled = false },
  ref
) => {
  const createChatBotMessageRef = useRef<any>(null);
  const setStateRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const [chatConfig, setChatConfig] = useState(config);
  const [chatKey, setChatKey] = useState(0);
  const hasRestoredRef = useRef(false);
  
  // Set up socket connection and listen for chat history
  useEffect(() => {
    const socket = acquireSocket(SOCKET_URL);
    socketRef.current = socket;
    
    // Listen for chat history sync
    const handleChatHistorySync = (data: { messages: Array<{
      id: string;
      type: 'user' | 'bot';
      content: string;
      nickname?: string;
      replyToId?: string;
      replyToPreview?: string;
      replyToNickname?: string;
      timestamp: string;
    }> }) => {
      console.log('[ChatHistory] Received history:', data.messages.length, 'messages');
      
      if (hasRestoredRef.current) {
        console.log('[ChatHistory] Already restored, skipping');
        return;
      }
      
      if (data.messages.length === 0) {
        console.log('[ChatHistory] No messages to restore');
        hasRestoredRef.current = true;
        return;
      }
      
      // Wait for createChatBotMessage to be available
      const waitForInit = setInterval(() => {
        if (createChatBotMessageRef.current) {
          clearInterval(waitForInit);
          
          console.log('[ChatHistory] Restoring messages...');
          const restoredMessages = data.messages.map((msg, idx) => {
            console.log(`[ChatHistory] Message ${idx}:`, {
              type: msg.type,
              content: msg.content.substring(0, 50),
              nickname: msg.nickname
            });
            
            if (msg.type === 'user') {
              // User messages are stored with raw content on server
              // We need to encode them for display (adds __NICK__ prefix for our component)
              const encodedText = msg.nickname 
                ? encodeUserText(msg.nickname, msg.content)
                : msg.content;
              
              console.log(`[ChatHistory] User message - raw content: "${msg.content}", encoded: "${encodedText.substring(0, 50)}"`);
              
              // Create a proper user message object
              // react-chatbot-kit expects user messages to have specific structure
              return {
                loading: false,
                widget: undefined,
                delay: 0,
                type: 'user',
                message: encodedText,
                id: Date.now() + idx,
              };
            } else {
              // Encode bot message with reply metadata
              const encoded = encodeBotMessage({
                content: msg.content,
                replyToId: msg.replyToId,
                replyToPreview: msg.replyToPreview,
                replyToNickname: msg.replyToNickname,
              });
              return createChatBotMessageRef.current(encoded);
            }
          });
          
          console.log('[ChatHistory] Restored', restoredMessages.length, 'messages');
          
          // Update config with restored messages and force re-mount
          setChatConfig({
            ...config,
            initialMessages: restoredMessages as any,
          });
          setChatKey(prev => prev + 1);
          hasRestoredRef.current = true;
        }
      }, 50);
      
      // Cleanup timeout after 3 seconds
      setTimeout(() => clearInterval(waitForInit), 3000);
    };
    
    socket.on(SOCKET_EVENTS.CHAT_HISTORY_SYNC, handleChatHistorySync);
    
    return () => {
      socket.off(SOCKET_EVENTS.CHAT_HISTORY_SYNC, handleChatHistorySync);
      releaseSocket(socket);
      socketRef.current = null;
    };
  }, []);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addBotMessage: (content: string) => {
      if (createChatBotMessageRef.current && setStateRef.current) {
        const encoded = encodeBotMessage({ content });
        const botMessage = createChatBotMessageRef.current(encoded);
        setStateRef.current((prev: any) => ({
          ...prev,
          messages: [...prev.messages, botMessage],
        }));
      }
    },
  }));

  // Create a wrapper that injects the chatService and captures refs
  const ActionProviderWithService = React.useMemo(
    () => (props: any) => {
      createChatBotMessageRef.current = props.createChatBotMessage;
      setStateRef.current = props.setState;
      // Always get the current socket reference
      return <ActionProvider {...props} chatService={chatService} socket={socketRef.current} />;
    },
    [chatService]
  );

  return (
    <div className="w-full h-full flex flex-col border border-[#3e3e42] rounded-lg overflow-hidden">
      <div className={`h-full flex flex-col ${disabled ? 'chatbot-disabled' : ''}`}>
        <Chatbot
          key={chatKey}
          config={chatConfig}
          messageParser={MessageParser}
          actionProvider={ActionProviderWithService}
          placeholderText={disabled ? "游戏未开始" : "向主持人提问"}
        />
      </div>
    </div>
  );
});
