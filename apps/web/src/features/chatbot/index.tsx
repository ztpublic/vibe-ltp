'use client';

import React, { useImperativeHandle, useRef } from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import './chatbot.css';
import config from './config';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';
import type { ChatService } from './services';
import { encodeBotMessage } from './utils/chatEncoding';

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
      return <ActionProvider {...props} chatService={chatService} />;
    },
    [chatService]
  );

  return (
    <div className="w-full h-full flex flex-col border border-[#3e3e42] rounded-lg overflow-hidden">
      <div className={`h-full flex flex-col ${disabled ? 'chatbot-disabled' : ''}`}>
        <Chatbot
          config={config}
          messageParser={MessageParser}
          actionProvider={ActionProviderWithService}
          placeholderText={disabled ? "游戏未开始" : "向主持人提问"}
        />
      </div>
    </div>
  );
});
