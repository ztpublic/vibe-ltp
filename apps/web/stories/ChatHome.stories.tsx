import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ChatHome } from '../src/features/chatbot/ChatHome';
import { MockChatService } from '../src/features/chatbot/services';
import { useMockGameStateController, useMockChatHistoryController } from '../src/features/chatbot/controllers';
import { samplePuzzle, generateMockConversation } from './mockData';
import React from 'react';

const meta: Meta<typeof ChatHome> = {
  title: 'Pages/ChatHome',
  component: ChatHome,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ChatHome>;

// Story 1: Initial state - no game, no messages
export const NotStarted: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'NotStarted',
      puzzleContent: null,
      isConnected: true,
    });
    const chatHistoryController = useMockChatHistoryController([]);
    const chatService = new MockChatService();

    return (
      <ChatHome
        sessionId="storybook-session"
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};

// Story 2: In-game state with rich conversation and puzzle surface
export const Started_WithConversation: Story = {
  render: () => {
    const gameStateController = useMockGameStateController({
      gameState: 'Started',
      puzzleContent: samplePuzzle,
      isConnected: true,
    });
    const chatHistoryController = useMockChatHistoryController(generateMockConversation(20));
    const chatService = new MockChatService();

    return (
      <ChatHome
        sessionId="storybook-session"
        gameStateController={gameStateController}
        chatService={chatService}
        chatHistoryController={chatHistoryController}
      />
    );
  },
};
