'use client';

import React from 'react';
import Chatbot from 'react-chatbot-kit';
import config from './config';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';

export const SoupBotChat: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Chatbot
        config={config}
        messageParser={MessageParser}
        actionProvider={ActionProvider}
      />
    </div>
  );
};
