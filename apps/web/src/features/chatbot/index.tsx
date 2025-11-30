'use client';

import React, { useImperativeHandle, useRef, useState, useEffect, useMemo } from 'react';
import { Chatbot, encodeBotMessage, encodeUserText, createChatBotMessage } from '@vibe-ltp/react-chatbot-kit';
import '@vibe-ltp/react-chatbot-kit/build/main.css';
import './chatbot.css';
import config from './config';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';
import type { ChatService } from './services';
import type { ChatHistoryController } from './controllers';
import { useChatIdentity } from './identity/useChatIdentity';

export type SoupBotChatProps = {
  chatService: ChatService;
  chatHistoryController?: ChatHistoryController;
  disabled?: boolean;
};

export interface SoupBotChatRef {
  addBotMessage: (content: string) => void;
}

export const SoupBotChat = React.forwardRef<SoupBotChatRef, SoupBotChatProps>((
  { chatService, chatHistoryController, disabled = false },
  ref
) => {
  const { nickname } = useChatIdentity();
  const createChatBotMessageRef = useRef<any>(null);
  const setStateRef = useRef<any>(null);
  const [chatKey, setChatKey] = useState(0);
  
  // Convert chat history messages to chatbot format
  const initialMessages = useMemo(() => {
    if (!chatHistoryController || chatHistoryController.messages.length === 0) {
      return [];
    }

    const messages = chatHistoryController.messages;
    
    const converted = messages.map((msg, idx) => {
      if (msg.type === 'user') {
        // User messages - encode with nickname
        const encodedText = msg.nickname 
          ? encodeUserText(msg.nickname, msg.content)
          : msg.content;
        
        return {
          loading: false,
          widget: undefined,
          delay: 0,
          type: 'user',
          message: encodedText,
          id: Date.now() + idx,
        };
      } else {
        // Bot messages - encode with reply metadata
        const encoded = encodeBotMessage({
          content: msg.content,
          replyToId: msg.replyToId,
          replyToPreview: msg.replyToPreview,
          replyToNickname: msg.replyToNickname,
        });
        return createChatBotMessage(encoded, {});
      }
    });
    
    return converted;
  }, [chatHistoryController, chatHistoryController?.messages]);
  
  // Create config with initial messages
  const chatConfig = useMemo(() => ({
    ...config,
    initialMessages,
  }), [initialMessages]);
  
  // Force remount when messages change
  useEffect(() => {
    setChatKey(prev => prev + 1);
  }, [initialMessages]);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addBotMessage: (content: string) => {
      if (createChatBotMessageRef.current && setStateRef.current) {
        const encoded = encodeBotMessage({ content });
        const botMessage = createChatBotMessageRef.current(encoded, { withAvatar: true });
        setStateRef.current((prev: any) => ({
          ...prev,
          messages: [...prev.messages, botMessage],
        }));
      }
    },
  }));

  // Create a wrapper that injects the chatService and chatHistoryController
  const ActionProviderWithService = React.useMemo(
    () => (props: any) => {
      createChatBotMessageRef.current = props.createChatBotMessage;
      setStateRef.current = props.setState;
      return <ActionProvider {...props} chatService={chatService} chatHistoryController={chatHistoryController} />;
    },
    [chatService, chatHistoryController]
  );

  // Validator function to intercept and encode user messages before they're added to state
  const validateAndEncodeMessage = (message: string) => {
    if (!message || typeof message !== 'string') return true;
    // This validator is called before the message is added to state
    // Return true to allow the message to be added
    return true;
  };

  return (
    <div className="w-full h-full flex flex-col border border-[#3e3e42] rounded-lg overflow-hidden">
      <div className={`h-full flex flex-col ${disabled ? 'chatbot-disabled' : ''}`}>
        <Chatbot
          key={chatKey}
          config={chatConfig}
          messageParser={MessageParser}
          actionProvider={ActionProviderWithService}
          placeholderText={disabled ? "游戏未开始" : "向主持人提问"}
          validator={validateAndEncodeMessage}
          currentUserNickname={nickname}
        />
      </div>
    </div>
  );
});
