'use client';

import { NicknameBadge } from './components/NicknameBadge';

type ChatbotMessageConfig = {
  message: string;
  id?: string | number;
};

type ChatbotConfig = {
  botName?: string;
  initialMessages: ChatbotMessageConfig[];
  customComponents?: Record<string, unknown>;
};

export const BOT_NAME = '主持人';

const config: ChatbotConfig = {
  botName: BOT_NAME,
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
