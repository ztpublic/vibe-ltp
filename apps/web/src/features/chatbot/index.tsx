'use client';

import React from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import './chatbot.css';
import config from './config';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';
import type { ChatService } from './services';

export type SoupBotChatProps = {
  roomId?: string;
  chatService: ChatService;
  disabled?: boolean;
};

export const SoupBotChat: React.FC<SoupBotChatProps> = ({
  roomId,
  chatService,
  disabled = false,
}) => {
  // Create a wrapper that injects the chatService into ActionProvider
  const ActionProviderWithService = React.useMemo(
    () => (props: any) => <ActionProvider {...props} chatService={chatService} />,
    [chatService]
  );

  return (
    <div className="w-full h-full flex flex-col border border-[#3e3e42] rounded-lg overflow-hidden">
      <div className={disabled ? 'chatbot-disabled' : ''}>
        <Chatbot
          config={config}
          messageParser={MessageParser}
          actionProvider={ActionProviderWithService}
          placeholderText={disabled ? "游戏未开始" : "向主持人提问"}
        />
      </div>
    </div>
  );
};
