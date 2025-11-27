'use client';

import React from 'react';
import Chatbot from 'react-chatbot-kit';
import config from './config';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';

export type SoupBotChatProps = {
  roomId?: string;
  actionProviderOverride?: any;
};

export const SoupBotChat: React.FC<SoupBotChatProps> = ({
  roomId,
  actionProviderOverride,
}) => {
  const ActionProviderComponent = actionProviderOverride ?? ActionProvider;

  return (
    <div className="w-full h-full flex flex-col">
      <Chatbot
        config={config}
        messageParser={MessageParser}
        actionProvider={ActionProviderComponent}
      />
    </div>
  );
};
