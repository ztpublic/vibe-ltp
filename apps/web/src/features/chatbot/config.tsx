'use client';

import { createChatBotMessage } from '@vibe-ltp/react-chatbot-kit';
import { PuzzleBotMessage } from './components/PuzzleBotMessage';
import { PuzzleUserMessage } from './components/PuzzleUserMessage';
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
