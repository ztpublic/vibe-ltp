'use client';

import React, { useImperativeHandle, useRef, useEffect, useMemo } from 'react';
import { Chatbot, createChatBotMessage } from '../../ui/chatbot';
import '../../ui/chatbot/main.css';
import './chatbot.css';
import config from './config';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';
import type { ChatService } from './services';
import type { ChatHistoryController } from './controllers';
import { useChatIdentity } from './identity/useChatIdentity';
import { isUserMessage, isBotMessage, type BotMessage, type ChatMessage } from '@vibe-ltp/shared';
import { buildAnswerDecorator } from './utils/answerDecorators';
import {
  createChatbotMessageStore,
  type ChatbotMessageStore,
  type ChatbotUiMessage,
  type ChatbotState,
} from './messageStore';

type CreateChatBotMessage = typeof createChatBotMessage;
type ChatbotKitMessage = ChatbotUiMessage;

const convertHistoryMessages = (messages: ChatMessage[]): ChatbotKitMessage[] => {
  return messages
    .map((msg) => {
      if (isUserMessage(msg)) {
        const decorator = msg.answer ? buildAnswerDecorator(msg.answer, msg.answerTip) : null;

        return {
          loading: false,
          widget: undefined,
          delay: 0,
          type: 'user' as const,
          message: msg.content,
          nickname: msg.nickname,
          id: msg.id ?? Date.now(),
          serverMessageId: msg.id,
          ...(decorator ? { decorators: [decorator] } : {}),
        };
      }

      if (isBotMessage(msg)) {
        const botMsg = msg as Extract<ChatMessage, { type: 'bot' }>;
        const botMessage = {
          ...(createChatBotMessage(botMsg.content, {
            replyToId: botMsg.replyMetadata?.replyToId,
            replyToPreview: botMsg.replyMetadata?.replyToPreview,
            replyToNickname: botMsg.replyMetadata?.replyToNickname,
          }) as unknown as ChatbotUiMessage),
          type: 'bot' as const,
          withAvatar: true,
        };

        return {
          ...botMessage,
          loading: false,
          id: botMsg.id ?? botMessage.id,
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
  const createChatBotMessageRef = useRef<CreateChatBotMessage | null>(null);
  const setStateRef = useRef<React.Dispatch<React.SetStateAction<ChatbotState>> | null>(null);
  const chatbotStateRef = useRef<ChatbotState | null>(null);
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

  // Trigger initial history sync lifecycle
  useEffect(() => {
    let isActive = true;
    if (!chatHistoryController) return;

    const runSync = async () => {
      if (messageStoreRef.current?.getMessages().length) {
        return;
      }
      try {
        const synced = await chatHistoryController.syncHistory();
        if (!isActive || !messageStoreRef.current) return;
        if (synced.length > 0) {
          const historyMessages = convertHistoryMessages(synced);
          messageStoreRef.current.replaceMessages(historyMessages, { preserveTrailingLoading: true });
        }
      } catch (error) {
        console.warn('[SoupBotChat] History sync failed', error);
      }
    };

    runSync();
    return () => {
      isActive = false;
    };
  }, [chatHistoryController]);
  
  // Expose methods to parent component
  useImperativeHandle(
    ref,
    () => ({
      addBotMessage: (message: BotMessage) => {
        if (!messageStoreRef.current || !createChatBotMessageRef.current) return;

        const botMessageNode: ChatbotUiMessage = {
          ...(createChatBotMessageRef.current(message.content, {
            replyToId: message.replyMetadata?.replyToId,
            replyToPreview: message.replyMetadata?.replyToPreview,
            replyToNickname: message.replyMetadata?.replyToNickname,
          }) as unknown as ChatbotUiMessage),
          type: 'bot',
        };

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
    () =>
      (props: {
        createChatBotMessage: CreateChatBotMessage;
        setState: React.Dispatch<React.SetStateAction<ChatbotState>>;
        state: ChatbotState;
        children?: React.ReactNode;
      }) => {
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
  const validateAndEncodeMessage: (message: string) => boolean = (message: string) => {
    if (!message || typeof message !== 'string') return true;
    return true;
  };

  return (
    <div className="w-full h-full flex flex-col border border-[#3e3e42] rounded-lg overflow-hidden">
      <div className={`h-full flex flex-col ${disabled ? 'chatbot-disabled' : ''}`}>
        <Chatbot
          key="chatbot"
          config={chatConfig as any}
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
