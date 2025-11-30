'use client';

import React, { useImperativeHandle, useRef, useEffect, useMemo } from 'react';
import { Chatbot, createChatBotMessage } from '@vibe-ltp/react-chatbot-kit';
import '@vibe-ltp/react-chatbot-kit/build/main.css';
import './chatbot.css';
import config from './config';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';
import type { ChatService } from './services';
import type { ChatHistoryController } from './controllers';
import { useChatIdentity } from './identity/useChatIdentity';
import { isUserMessage, isBotMessage, type BotMessage, type ChatMessage } from '@vibe-ltp/shared';
import { createChatbotMessageStore, type ChatbotMessageStore } from './messageStore';

const convertHistoryMessages = (messages: ChatMessage[]) => {
  return messages
    .map((msg) => {
      if (isUserMessage(msg)) {
        return {
          loading: false,
          widget: undefined,
          delay: 0,
          type: 'user',
          message: msg.content,
          nickname: msg.nickname,
          id: (msg as any).id ?? Date.now(),
        };
      }

      if (isBotMessage(msg)) {
        const botMsg = msg as Extract<ChatMessage, { type: 'bot' }>;
        const botMessage = createChatBotMessage(botMsg.content, {
          replyToId: botMsg.replyMetadata?.replyToId,
          replyToPreview: botMsg.replyMetadata?.replyToPreview,
          replyToNickname: botMsg.replyMetadata?.replyToNickname,
        } as any);

        return {
          ...botMessage,
          loading: false,
          id: (botMsg as any).id ?? botMessage.id,
        };
      }

      return null;
    })
    .filter((msg): msg is NonNullable<typeof msg> => msg !== null);
};

export type SoupBotChatProps = {
  chatService: ChatService;
  chatHistoryController?: ChatHistoryController;
  disabled?: boolean;
};

export interface SoupBotChatRef {
  addBotMessage: (message: BotMessage) => void;
}

export const SoupBotChat = React.forwardRef<SoupBotChatRef, SoupBotChatProps>((
  { chatService, chatHistoryController, disabled = false },
  ref
) => {
  const { nickname } = useChatIdentity();
  const createChatBotMessageRef = useRef<any>(null);
  const setStateRef = useRef<any>(null);
  const chatbotStateRef = useRef<any>(null);
  const messageStoreRef = useRef<ChatbotMessageStore | null>(null);
  
  // Convert chat history messages to chatbot format
  const initialMessages = useMemo(() => {
    if (!chatHistoryController || chatHistoryController.messages.length === 0) {
      return [];
    }

    return convertHistoryMessages(chatHistoryController.messages);
  }, [chatHistoryController, chatHistoryController?.messages]);
  
  // Create config with initial messages
  const chatConfig = useMemo(() => ({
    ...config,
    initialMessages,
  }), [initialMessages]);
  
  // Sync incoming history updates into the chatbot state without wiping loading placeholders
  useEffect(() => {
    if (!chatHistoryController || !messageStoreRef.current) {
      return;
    }

    const historyMessages = convertHistoryMessages(chatHistoryController.messages);
    messageStoreRef.current.replaceMessages(historyMessages, { preserveTrailingLoading: true });
  }, [chatHistoryController?.messages]);
  
  // Expose methods to parent component
  useImperativeHandle(
    ref,
    () => ({
      addBotMessage: (message: BotMessage) => {
        if (!messageStoreRef.current || !createChatBotMessageRef.current) return;

        const botMessageNode = createChatBotMessageRef.current(message.content, {
          replyToId: message.replyMetadata?.replyToId,
          replyToPreview: message.replyMetadata?.replyToPreview,
          replyToNickname: message.replyMetadata?.replyToNickname,
        });

        messageStoreRef.current.appendMessage(botMessageNode);

        if (chatHistoryController) {
          const botChatMessage: ChatMessage = {
            ...message,
            timestamp: message.timestamp ?? new Date().toISOString(),
          };
          chatHistoryController.onMessageAdded(botChatMessage);
        }
      },
    }),
    [chatHistoryController]
  );

  // Create a wrapper that injects the chatService and chatHistoryController
  const ActionProviderWithService = React.useMemo(
    () => (props: any) => {
      createChatBotMessageRef.current = props.createChatBotMessage;
      setStateRef.current = props.setState;
      chatbotStateRef.current = props.state;

      if (!messageStoreRef.current && setStateRef.current) {
        messageStoreRef.current = createChatbotMessageStore({
          getState: () => chatbotStateRef.current,
          setState: setStateRef.current,
        });
      }

      return (
        <ActionProvider
          {...props}
          chatService={chatService}
          chatHistoryController={chatHistoryController}
          messageStore={messageStoreRef.current!}
        />
      );
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
          key="chatbot"
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
