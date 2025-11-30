'use client';

import { NicknameBadge } from './components/NicknameBadge';

export const BOT_NAME = '主持人';

const config = {
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
