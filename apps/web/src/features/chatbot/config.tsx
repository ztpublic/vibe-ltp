'use client';

import { createChatBotMessage } from 'react-chatbot-kit';
import { PuzzleBotMessage } from './components/PuzzleBotMessage';
import { PuzzleUserMessage } from './components/PuzzleUserMessage';

export const BOT_NAME = '主持人';

const config = {
  botName: BOT_NAME,
  initialMessages: [
    createChatBotMessage(
      `你好，我是 ${BOT_NAME}。我们来玩海龟汤吧，随便问任何"是/否"问题来探索真相。`,
      {}
    ),
  ],
  customComponents: {
    botChatMessage: (props: any) => <PuzzleBotMessage {...props} />,
    userChatMessage: (props: any) => <PuzzleUserMessage {...props} />,
  },
  customStyles: {
    botMessageBox: {
      backgroundColor: '#2d2d30',
      color: '#cccccc',
    },
    userMessageBox: {
      backgroundColor: '#094771',
      color: '#ffffff',
    },
    chatButton: {
      backgroundColor: '#0e639c',
    },
    chatContainer: {
      height: '100%',
      width: '100%',
    },
  },
};

export default config;
