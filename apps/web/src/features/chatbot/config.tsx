'use client';

import { NicknameBadge } from './components/NicknameBadge';
import { DEFAULT_BOT_NAME } from './botIdentity';

type ChatbotMessageConfig = {
  message: string;
  id?: string | number;
};

type ChatbotConfig = {
  botName?: string;
  initialMessages: ChatbotMessageConfig[];
  customComponents?: Record<string, unknown>;
};

const config: ChatbotConfig = {
  botName: DEFAULT_BOT_NAME,
  initialMessages: [],
  customComponents: {
    header: () => (
      <div className="react-chatbot-kit-chat-header">
        <div className="flex items-center justify-between w-full px-4 py-2">
          <span className="font-semibold">海龟汤聊天室</span>
          <NicknameBadge />
        </div>
      </div>
    ),
  },
};

export default config;
