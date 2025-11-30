'use client';

import React, { useImperativeHandle, useRef, useState, useEffect, useMemo } from 'react';
import { Chatbot, createChatBotMessage } from '@vibe-ltp/react-chatbot-kit';
import '@vibe-ltp/react-chatbot-kit/build/main.css';
import './chatbot.css';
import config from './config';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';
import type { ChatService } from './services';
import type { ChatHistoryController } from './controllers';
import { useChatIdentity } from './identity/useChatIdentity';
import { isUserMessage, isBotMessage, type ChatMessage } from '@vibe-ltp/shared';

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
    
    const converted = messages.map((msg: ChatMessage, idx: number) => {
      if (isUserMessage(msg)) {
        // User messages - pass structured fields (no encoding)
        return {
          loading: false,
          widget: undefined,
          delay: 0,
          type: 'user',
          message: msg.content,
          nickname: msg.nickname,
          id: Date.now() + idx,
        };
      } else if (isBotMessage(msg)) {
        // Bot messages - pass structured reply metadata (no encoding)
        const botMsg = msg as Extract<ChatMessage, { type: 'bot' }>;
        const botMessage = createChatBotMessage(botMsg.content, {
          replyToId: botMsg.replyMetadata?.replyToId,
          replyToPreview: botMsg.replyMetadata?.replyToPreview,
          replyToNickname: botMsg.replyMetadata?.replyToNickname,
        } as any); // Type assertion needed until react-chatbot-kit types are rebuilt
        return botMessage;
      }
      // System messages or other types - skip
      return null;
    }).filter((msg): msg is NonNullable<typeof msg> => msg !== null);
    
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
        // Create bot message with plain content (no encoding)
        const botMessage = createChatBotMessageRef.current(content, { withAvatar: true });
        setStateRef.current((prev: any) => ({
          ...prev,
          messages: [...prev.messages, botMessage],
        }));
        
        // Persist message to server via chat history controller
        if (chatHistoryController) {
          const botChatMessage: ChatMessage = {
            id: `bot-${Date.now()}`,
            type: 'bot' as const,
            content,
            timestamp: new Date().toISOString(),
          };
          chatHistoryController.onMessageAdded(botChatMessage);
        }
      }
    },
  }), [chatHistoryController]);

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
