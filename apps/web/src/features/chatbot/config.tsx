'use client';

import { createChatBotMessage } from 'react-chatbot-kit';

export const BOT_NAME = 'SoupBot';

const config = {
  botName: BOT_NAME,
  initialMessages: [
    createChatBotMessage(
      `你好，我是 ${BOT_NAME}。我们来玩海龟汤吧，随便问任何"是/否"问题来探索真相。`,
      {}
    ),
  ],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#f3f4f6',
    },
    chatButton: {
      backgroundColor: '#2563eb',
    },
    chatContainer: {
      height: '100%',
      width: '100%',
    },
  },
};

export default config;
